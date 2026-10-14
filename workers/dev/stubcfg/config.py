# test-only stand-in for the bot's `config` module (never shipped)
import os
class _S:
    BOT_TOKEN = os.getenv("BOT_TOKEN", "123456:TESTTOKENabcdefghijk")
    SUPER_ADMIN_UID = int(os.getenv("SUPER_ADMIN_UID", "777"))
    BLUEWALL_PORT = int(os.getenv("BLUEWALL_PORT", "8591"))
    BLUEWALL_PUBLIC = True
    def __getattr__(self, k): return None
settings = _S()
