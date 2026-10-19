# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

RCM staff verifying dental insurance, one patient at a time, often by pasting a Google Sheet or portal text into the form.

## Product Purpose

Replace the Smile Loft Dental VOI sheet with a form staff can fill, review, copy, and print. Success is a complete verification the staff trust enough to copy or print, with every extracted field visible for review.

## Positioning

The form reads a pasted sheet grid or portal text and fills the matching verification fields, including values that sit in the next cell or across merged columns. A neighboring form that only accepts "Label: value" lines cannot do that job.

## Operating Context

Staff work at a desk, often with a sheet or eligibility paste on one side and this form on the other. The sheet they copy is the Smile Loft Dental VOI Form. Office names such as Affinity appear as an unlabeled cell. Records stay in the session only.

## Capabilities and Constraints

Confirmed: every sheet field, in the sheet's labels; percent and frequency dropdowns; extract with yellow review highlights; copy summary; print or save as PDF; reset; blank table values. The page may regroup those fields when the task gets faster. Field ids stay stable. No Google Sheets save, search, auth, or remote extraction in this version. Dummy data only. Do not log pasted text or form contents. Do not store patient details in localStorage. The theme key `dental-voi-theme` is the only localStorage key.

Scope of this product record: the dental VOI app only. The portfolio and workout app beside it are out of scope.

## Evidence on Hand

The working form is the app in this folder. The reference sheet is a screenshot of Smile Loft Dental VOI Form (dummy values: subscriber subtest, sub id 1234, office Affinity). Do not invent patient histories, payer rules, or clinic claims.

## Product Principles

- The pasted source and the filled form should be checkable in one pass.
- Extracted values stay marked until a person edits them.
- Nothing real about a patient leaves the browser.
- Speed comes from grouping the verification, not from hiding fields.
- Sheet language stays the language of the form.
