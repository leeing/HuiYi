from passlib.context import CryptContext

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    result: str = _pwd_context.hash(plain)
    return result


def verify_password(plain: str, hashed: str) -> bool:
    result: bool = _pwd_context.verify(plain, hashed)
    return result
