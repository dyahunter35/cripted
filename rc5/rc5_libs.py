"""RC5 (RC5-32/12/16) Library Wrapper interface."""
from rc5_manual import (
    rc5_setup,
    rc5_encrypt_block,
    rc5_decrypt_block,
    derive_key,
    rc5_encrypt,
    rc5_decrypt,
    main,
)

if __name__ == "__main__":
    main()
