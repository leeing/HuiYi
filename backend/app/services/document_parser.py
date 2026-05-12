"""Document parser for extracting text and metadata from various book formats."""

from __future__ import annotations

import logging
import tempfile
from pathlib import Path
from typing import Any

logger = logging.getLogger("huiyi.document_parser")


class DocumentParser:
    """Extract text and metadata from PDF, EPUB, MOBI, and TXT files."""

    @staticmethod
    def extract_text(file_path: Path, file_type: str) -> str:
        """Extract plain text content from a document."""
        if file_type == "txt":
            return DocumentParser._extract_txt(file_path)
        elif file_type == "pdf":
            return DocumentParser._extract_pdf(file_path)
        elif file_type == "epub":
            return DocumentParser._extract_epub(file_path)
        elif file_type == "mobi":
            return DocumentParser._extract_mobi(file_path)
        else:
            logger.warning(
                "Unknown file type %s, falling back to text extraction", file_type
            )
            return DocumentParser._extract_txt(file_path)

    @staticmethod
    def extract_metadata(file_path: Path, file_type: str) -> dict[str, Any]:
        """Extract metadata from a document."""
        if file_type == "txt":
            return DocumentParser._metadata_txt(file_path)
        elif file_type == "pdf":
            return DocumentParser._metadata_pdf(file_path)
        elif file_type == "epub":
            return DocumentParser._metadata_epub(file_path)
        elif file_type == "mobi":
            return DocumentParser._metadata_mobi(file_path)
        else:
            return {}

    @staticmethod
    def _extract_txt(file_path: Path) -> str:
        """Extract text from plain text file."""
        try:
            return file_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            return file_path.read_text(encoding="latin-1")

    @staticmethod
    def _metadata_txt(file_path: Path) -> dict[str, Any]:
        """Get metadata from plain text file."""
        stat = file_path.stat()
        return {
            "file_size": stat.st_size,
            "pages": 1,
        }

    @staticmethod
    def _extract_pdf(file_path: Path) -> str:
        """Extract text from PDF file."""
        try:
            from pypdf import PdfReader

            reader = PdfReader(file_path)
            text_parts = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
            return "\n\n".join(text_parts)
        except Exception as exc:  # pragma: no cover
            logger.error("PDF extraction failed for %s: %s", file_path, exc)
            return ""

    @staticmethod
    def _metadata_pdf(file_path: Path) -> dict[str, Any]:
        """Get metadata from PDF file."""
        try:
            from pypdf import PdfReader

            reader = PdfReader(file_path)
            pdf_meta: dict[str, Any] = reader.metadata or {}
            return {
                "file_size": file_path.stat().st_size,
                "pages": len(reader.pages),
                "title": pdf_meta.get("/Title", ""),
                "author": pdf_meta.get("/Author", ""),
            }
        except Exception as exc:  # pragma: no cover
            logger.error("PDF metadata extraction failed for %s: %s", file_path, exc)
            return {"file_size": file_path.stat().st_size, "pages": 0}

    @staticmethod
    def _extract_epub(file_path: Path) -> str:
        """Extract text from EPUB file."""
        try:
            from ebooklib import epub

            book = epub.read_epub(str(file_path))
            text_parts = []
            for item in book.get_items():
                if item.get_type() == 9:  # EPUBBOOK
                    content = item.get_content().decode("utf-8", errors="ignore")
                    text_parts.append(DocumentParser._strip_html(content))
            return "\n\n".join(text_parts)
        except Exception as exc:  # pragma: no cover
            logger.error("EPUB extraction failed for %s: %s", file_path, exc)
            return ""

    @staticmethod
    def _metadata_epub(file_path: Path) -> dict[str, Any]:
        """Get metadata from EPUB file."""
        try:
            from ebooklib import epub

            book = epub.read_epub(str(file_path))
            metadata: dict[str, Any] = {
                "file_size": file_path.stat().st_size,
            }
            title_data = book.get_metadata("EBK", "title")
            if title_data:
                metadata["title"] = title_data[0][0] if title_data[0] else ""
            creator_data = book.get_metadata("EBK", "creator")
            if creator_data:
                metadata["author"] = creator_data[0][0] if creator_data[0] else ""
            # Count chapters/sections
            chapters = [item for item in book.get_items() if item.get_type() == 1]
            metadata["chapters"] = len(chapters)
            return metadata
        except Exception as exc:  # pragma: no cover
            logger.error("EPUB metadata extraction failed for %s: %s", file_path, exc)
            return {"file_size": file_path.stat().st_size, "chapters": 0}

    @staticmethod
    def _extract_mobi(file_path: Path) -> str:
        """Extract text from MOBI file."""
        try:
            import mobi

            with tempfile.TemporaryDirectory() as tmp_dir:
                tmp_path = Path(tmp_dir)
                mobi.extract(str(file_path), str(tmp_path))
                # Find the extracted HTML/text files
                html_files = list(tmp_path.glob("*.html")) + list(
                    tmp_path.glob("*.htm")
                )
                if not html_files:
                    # Try to find any text content
                    text_files = list(tmp_path.glob("*.txt"))
                    if text_files:
                        content_parts = []
                        for tf in sorted(text_files):
                            content_parts.append(
                                tf.read_text(encoding="utf-8", errors="ignore")
                            )
                        return "\n\n".join(content_parts)
                    return ""
                content_parts = []
                for hf in sorted(html_files):
                    html_content = hf.read_text(encoding="utf-8", errors="ignore")
                    content_parts.append(DocumentParser._strip_html(html_content))
                return "\n\n".join(content_parts)
        except Exception as exc:  # pragma: no cover
            logger.error("MOBI extraction failed for %s: %s", file_path, exc)
            return ""

    @staticmethod
    def _metadata_mobi(file_path: Path) -> dict[str, Any]:
        """Get metadata from MOBI file."""
        try:
            import mobi

            with tempfile.TemporaryDirectory() as tmp_dir:
                tmp_path = Path(tmp_dir)
                mobi.extract(str(file_path), str(tmp_path))
                metadata: dict[str, Any] = {"file_size": file_path.stat().st_size}
                # Try to read metadata from opf or other files
                opf_files = list(tmp_path.glob("*.opf"))
                if opf_files:
                    opf_content = opf_files[0].read_text(
                        encoding="utf-8", errors="ignore"
                    )
                    title_match = DocumentParser._extract_meta_from_opf(
                        opf_content, "title"
                    )
                    if title_match:
                        metadata["title"] = title_match
                    author_match = DocumentParser._extract_meta_from_opf(
                        opf_content, "creator"
                    )
                    if author_match:
                        metadata["author"] = author_match
                return metadata
        except Exception as exc:  # pragma: no cover
            logger.error("MOBI metadata extraction failed for %s: %s", file_path, exc)
            return {"file_size": file_path.stat().st_size}

    @staticmethod
    def _extract_meta_from_opf(opf_content: str, meta_name: str) -> str | None:
        """Extract metadata from OPF file content."""
        import re

        if meta_name == "title":
            match = re.search(
                r"<dc:title[^>]*>([^<]+)</dc:title>", opf_content, re.IGNORECASE
            )
        elif meta_name == "creator":
            match = re.search(
                r"<dc:creator[^>]*>([^<]+)</dc:creator>", opf_content, re.IGNORECASE
            )
        else:
            return None
        return match.group(1).strip() if match else None

    @staticmethod
    def _strip_html(html_content: str) -> str:
        """Strip HTML tags from content."""
        import re

        # Remove script and style elements
        html_content = re.sub(
            r"<script[^>]*>.*?</script>",
            "",
            html_content,
            flags=re.DOTALL | re.IGNORECASE,
        )
        html_content = re.sub(
            r"<style[^>]*>.*?</style>",
            "",
            html_content,
            flags=re.DOTALL | re.IGNORECASE,
        )
        # Replace br tags with newlines
        html_content = re.sub(r"<br\s*/?>", "\n", html_content, flags=re.IGNORECASE)
        # Replace p tags with double newlines
        html_content = re.sub(r"</p>", "\n\n", html_content, flags=re.IGNORECASE)
        html_content = re.sub(r"</div>", "\n", html_content, flags=re.IGNORECASE)
        # Remove all remaining tags
        html_content = re.sub(r"<[^>]+>", "", html_content)
        # Decode common HTML entities
        html_content = html_content.replace("&nbsp;", " ")
        html_content = html_content.replace("&amp;", "&")
        html_content = html_content.replace("&lt;", "<")
        html_content = html_content.replace("&gt;", ">")
        html_content = html_content.replace("&quot;", '"')
        html_content = html_content.replace("&#39;", "'")
        # Clean up whitespace
        html_content = re.sub(r"[ \t]+", " ", html_content)
        html_content = re.sub(r"\n{3,}", "\n\n", html_content)
        return html_content.strip()
