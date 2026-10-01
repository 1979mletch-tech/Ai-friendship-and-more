# Preview Deployment

Goal: produce a private/test HTTPS preview tied to an exact commit.

Requirements:
- deploy only after exact-SHA CI green;
- show test/preview status where appropriate;
- use synthetic accounts/data;
- configure public env values separately from server secrets;
- restrict ALLOWED_ORIGIN to preview origin;
- do not enable paid billing;
- record deployment ID/URL/commit;
- run smoke + auth + safety + failure tests.

A repository URL is not a live app preview URL.
