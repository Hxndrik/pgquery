package main

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"time"
)

// A download link is the request plus an expiry, sealed with AES-GCM under a
// key generated when the process starts. Previews and downloads are plain
// GET requests (an <img>, a <video>, a link), so they can't carry a JSON body
// or headers, and putting the access and secret keys in the URL would leave
// them in reverse-proxy and browser logs. The sealed token is opaque, expires
// and needs no server-side storage. Restarting the server invalidates every
// outstanding link; the app asks for a new one whenever an object is opened.

const linkTTL = time.Hour

var errBadLink = errors.New("this download link is invalid or has expired")

type linkPayload struct {
	Req    s3Request `json:"r"`
	Key    string    `json:"k"`
	Inline bool      `json:"i,omitempty"` // PDFs: show in the browser instead of downloading
	Exp    int64     `json:"e"`
}

type linkSealer struct {
	aead cipher.AEAD
}

func newLinkSealer() (*linkSealer, error) {
	key := make([]byte, 32)
	if _, err := rand.Read(key); err != nil {
		return nil, err
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	aead, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	return &linkSealer{aead: aead}, nil
}

var linkAAD = []byte("pgquery s3 link v1")

func (s *linkSealer) seal(p linkPayload) (string, error) {
	plain, err := json.Marshal(p)
	if err != nil {
		return "", err
	}
	nonce := make([]byte, s.aead.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(s.aead.Seal(nonce, nonce, plain, linkAAD)), nil
}

func (s *linkSealer) open(token string, now time.Time) (linkPayload, error) {
	var p linkPayload
	raw, err := base64.RawURLEncoding.DecodeString(token)
	if err != nil || len(raw) <= s.aead.NonceSize() {
		return p, errBadLink
	}
	nonce, sealed := raw[:s.aead.NonceSize()], raw[s.aead.NonceSize():]
	plain, err := s.aead.Open(nil, nonce, sealed, linkAAD)
	if err != nil || json.Unmarshal(plain, &p) != nil || now.Unix() > p.Exp {
		return linkPayload{}, errBadLink
	}
	return p, nil
}
