"""IDEA (International Data Encryption Algorithm) Library Interface."""

from idea_manual import (
    mul_mod,
    inv_mul,
    inv_add,
    idea_expand_key,
    idea_invert_keys,
    idea_crypt_block,
    derive_key,
    idea_encrypt,
    idea_decrypt,
    main,
)

if __name__ == "__main__":
    main()
