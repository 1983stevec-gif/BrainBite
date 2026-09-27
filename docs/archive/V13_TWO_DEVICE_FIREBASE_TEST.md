# Two-Device Firebase Test

## Device A
1. Configure Firebase.
2. Create/sign in to the parent account.
3. Play at least one mission.
4. Create a second child profile.
5. Push to Cloud.

## Device B
1. Open BrainBite in a different browser/device.
2. Configure the same Firebase project.
3. Sign in with the same parent account.
4. Pull from Cloud.
5. Confirm both child profiles and progress appear.

## Isolation
1. Sign out on Device B.
2. Create/use a different Firebase parent account.
3. Pull from Cloud.
4. Confirm the first family's profiles do not appear.

Any cross-family data visibility is P0.
