"""RC6 (RC6-32/20/16, AES Finalist) Library Wrapper interface."""
from rc6_manual import (
    rc6_setup,
    rc6_encrypt_block,
    rc6_decrypt_block,
    derive_key,
    rc6_encrypt,
    rc6_decrypt,
    main,
)

if __name__ == "__main__":
    main()
