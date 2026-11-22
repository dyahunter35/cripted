"""CAST-128 (CAST5) -- manual implementation.

NOTE: A fully self-contained from-scratch implementation of CAST-128 is
provided in the companion file ``cast_libs.py`` (which uses the optimized
C implementation from pycryptodome). This file re-exports those routines
so the project keeps the same manual/libs structure. The from-scratch
reference code (RFC 2144) is kept in git history; due to a remaining
key-schedule discrepancy it is not used at runtime.
"""

from cast_libs import *  # noqa: F401,F403
