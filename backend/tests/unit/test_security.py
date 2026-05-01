from app.core.security import hash_password, verify_password


def test_hash_password_returns_string() -> None:
    hashed = hash_password("secret123")
    assert isinstance(hashed, str)
    assert hashed != "secret123"


def test_verify_password_correct() -> None:
    hashed = hash_password("my_password")
    assert verify_password("my_password", hashed) is True


def test_verify_password_wrong() -> None:
    hashed = hash_password("correct")
    assert verify_password("wrong", hashed) is False


def test_hash_is_unique() -> None:
    h1 = hash_password("same")
    h2 = hash_password("same")
    # bcrypt generates different salt each time
    assert h1 != h2
