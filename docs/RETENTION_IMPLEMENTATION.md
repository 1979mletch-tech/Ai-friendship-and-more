# Data retention implementation boundary

The client may display the configured retention window and identify records that appear older than that window, but it must not silently delete server data merely because a browser clock says a record is old.

Production retention enforcement belongs on the authenticated backend/database using server timestamps, documented retention jobs, auditable deletion outcomes and legal/operational exceptions where required.

Current default policy metadata is 365 days for conversations and zero grace days after confirmed account deletion. These are implementation defaults, not a claim that a deployed backend has executed deletion. Staging evidence must prove the actual backend behavior before launch.
