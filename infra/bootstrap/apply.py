#!/usr/bin/env python3
"""Applies infra/bootstrap/template.yaml with the trust subjects from
users.yaml. Run manually, by a human with AWS admin credentials, once
initially and again any time users.yaml changes.

Deliberately not something CI runs -- a workflow able to update its own
trust policy could grant itself broader access than intended.
"""

import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).parent
USERS_YAML = HERE / "users.yaml"
STACK_NAME = "cyrokx-ci-bootstrap"


def _parse_trusted_subjects() -> list[str]:
    subjects = []
    in_list = False
    for line in USERS_YAML.read_text().splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if stripped == "trusted_subjects:":
            in_list = True
            continue
        if in_list:
            if stripped.startswith("- "):
                subjects.append(stripped[2:].strip())
            else:
                break
    return subjects


def main() -> None:
    subjects = _parse_trusted_subjects()
    if not subjects:
        sys.exit("No trusted_subjects found in users.yaml")
    if any("REPLACE_WITH_ORG" in s for s in subjects):
        sys.exit("users.yaml still has the REPLACE_WITH_ORG placeholder -- fill in your GitHub org first")

    print("Applying cyrokx-ci-role trust policy for:")
    for subject in subjects:
        print(f"  - {subject}")

    subprocess.run(
        [
            "aws",
            "cloudformation",
            "deploy",
            "--template-file",
            str(HERE / "template.yaml"),
            "--stack-name",
            STACK_NAME,
            "--capabilities",
            "CAPABILITY_NAMED_IAM",
            "--parameter-overrides",
            f"TrustedSubjects={','.join(subjects)}",
        ],
        check=True,
    )


if __name__ == "__main__":
    main()
