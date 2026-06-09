# Admin Post Publish Check Design

## Goal

Add a lightweight publish check to the admin post editor so incomplete articles cannot be saved as published. Draft saving remains flexible.

This is phase 1 of the admin workflow improvements. It does not change the database schema and does not add notification safety behavior yet.

## Scope

In scope:

- Show a publish checklist in the post editor when the post is marked for publishing or is already published.
- Validate required publish fields before saving a post with `published = true`.
- Block the save and show a clear error when required publish fields are missing.
- Keep draft saves and autosaves working even when publish fields are incomplete.
- Add focused tests for the publish-check behavior.

Out of scope:

- Scheduled publishing.
- New post status values beyond the existing `published` boolean.
- Email or push notification confirmation flows.
- Duplicate notification prevention.
- SEO scoring or metadata generation.

## Requirements

The publish check passes only when all of these are true:

- `title` is not blank.
- `slug` is not blank.
- `excerpt` is not blank.
- `content` has non-empty text after trimming markup or whitespace.
- `tags` contains at least one non-empty tag.

Draft behavior:

- Posts with `published = false` can be saved with missing publish-check fields.
- Autosave continues to save editable content for existing posts and does not enforce publish checks.

Published behavior:

- If the editor form has `published = true`, submit/save must validate the publish check.
- If validation fails, no insert or update should be sent for the publish submit action.
- The editor should display a concise blocking message such as `請先完成發布檢查`.
- The checklist should make each missing item visible so the user can fix it without guessing.

## UI Design

Add a compact "發布檢查" section to `AdminPostEdit`.

Visibility:

- Show the section when the post is currently published or when the user checks the `發布` checkbox.
- Hide it for ordinary draft editing to keep the page quiet.

Checklist presentation:

- Each check item shows pass/fail state using existing understated admin styling.
- Text labels should be practical: `標題`, `Slug`, `摘要`, `內容`, `至少一個標籤`.
- When all checks pass, show a subtle success state.
- When one or more checks fail and the user tries to save as published, show the blocking error near the save controls or checklist.

## Data Flow

Create a small local helper inside `AdminPostEdit.jsx`:

- It reads the current form state.
- It normalizes tags from the comma-separated tag input.
- It strips HTML tags from content before checking whether content is effectively empty.
- It returns a list of check results, not just a boolean, so UI and submit logic share one source of truth.

Submit flow:

1. User submits the form.
2. `handleSubmit` builds or reads publish-check results.
3. If `form.published` is true and any check fails, set a validation error and return before calling Supabase.
4. If checks pass, continue with the existing slug-conflict check and insert/update logic.

Autosave flow:

- `doSave` remains scoped to title, slug, excerpt, content, and tags.
- It should not block incomplete drafts.
- It should not be responsible for changing publish state.

## Error Handling

- Validation errors are local UI errors and should not be sent to Supabase.
- Existing Supabase error handling remains unchanged.
- Slug conflict errors remain separate from publish-check errors.
- If both publish checks and slug conflict could fail, publish checks should run first because they do not require a network request.

## Testing

Update `AdminPostEdit.test.jsx` with focused coverage:

- Draft save can proceed when publish-check fields are incomplete.
- Published save is blocked when required fields are missing.
- Published save proceeds when all required fields are present.
- Checklist appears when `發布` is checked.
- Checklist remains hidden for an ordinary draft before publishing is selected.

Existing autosave and preview tests should continue passing.

## Implementation Notes

- Keep the change local to `AdminPostEdit.jsx` and its tests unless a small helper becomes clearly reusable.
- Do not add dependencies.
- Do not change the Supabase schema.
- Do not change email or push notification behavior in this phase.
