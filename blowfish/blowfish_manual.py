"""Blowfish (Bruce Schneier, 1993) -- manual and library interface wrapper."""

from blowfish_libs import (
    blowfish_encrypt,
    blowfish_decrypt,
    derive_key,
    main,
)

if __name__ == "__main__":
    main()
