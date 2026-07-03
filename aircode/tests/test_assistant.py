import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from aircode import assistant as A  # noqa: E402
from aircode.assistant import Assistant, build_messages, format_context  # noqa: E402
from aircode.index import Chunk  # noqa: E402
from aircode.retrieve import Hit  # noqa: E402


def _chunks():
    return [
        Chunk("auth.py", 1, 6, "def login(user, password):\n    return verify(user, password)"),
        Chunk("util.py", 1, 4, "def slugify(s):\n    return s.lower().replace(' ', '-')"),
    ]


def test_format_context_includes_paths_and_lines():
    hits = [Hit(_chunks()[0], 3.2)]
    ctx = format_context(hits)
    assert "auth.py:1-6" in ctx
    assert "def login" in ctx


def test_format_context_budget_caps_output():
    big = Chunk("big.py", 1, 999, "x\n" * 5000)
    hits = [Hit(big, 5.0), Hit(_chunks()[0], 4.0)]
    ctx = format_context(hits, budget_chars=200)
    # only the first (already-oversized) chunk is admitted; second is dropped
    assert "big.py" in ctx
    assert "auth.py" not in ctx


def test_build_messages_has_system_and_grounds_question():
    hits = [Hit(_chunks()[0], 3.2)]
    msgs = build_messages("how does login work?", hits)
    assert msgs[0]["role"] == "system"
    assert msgs[-1]["role"] == "user"
    assert "how does login work?" in msgs[-1]["content"]
    assert "auth.py" in msgs[-1]["content"]


def test_assistant_end_to_end_with_mocked_llm(monkeypatch):
    # Replace the network call with a deterministic fake stream.
    def fake_stream(messages, **kw):
        # prove the retrieved context reached the model
        joined = messages[-1]["content"]
        assert "auth.py" in joined
        yield "The "
        yield "login "
        yield "function verifies credentials."

    monkeypatch.setattr(A, "chat_stream", fake_stream, raising=False)
    # patch the lazily-imported symbol location too
    import aircode.llm as llm
    monkeypatch.setattr(llm, "chat_stream", fake_stream, raising=False)

    asst = Assistant(_chunks(), model="fake", host="http://x")
    hits, stream = asst.answer_stream("how does login work?")
    assert hits and hits[0].chunk.path == "auth.py"
    out = "".join(stream)
    assert out == "The login function verifies credentials."
    # history recorded for follow-ups
    assert len(asst.history) == 2
    assert asst.history[0]["role"] == "user"
