## Table of contents

- [Introduction](#introduction)
- [Inputs](#inputs)
- [Usage](#usage)

## Introduction

This action set the assignees on a PR based of a CODEOWNERS file.

## Inputs

| input                   | description                                          | required |
| ----------------------- | ---------------------------------------------------- | -------- |
| `github-token`          | Auth token with permissions to label PR              | `true`  |
| `codewatchers-filename` | Filename of codewatchers file. Default: CODEWATCHERS | `false`  |

## Usage

```yml
name: Add CODEWATCHERS
on:
  pull_request:
    types: [opened]
jobs:
  add-assignees:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - name: Add CODEWATCHERS as assignees
        uses: dovetail/codewatchers@latest
        with:
          codewatchers-filename: CODEWATCHERS
          github-token: ${{ secrets.GITHUB_TOKEN }}
```
