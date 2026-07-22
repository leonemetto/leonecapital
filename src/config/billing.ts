// Billing / trial configuration.
//
// CARD_REQUIRED — the master switch for the card-on-file trial model.
//
//   false (current live behavior):
//     Every signup is auto-granted a 14-day Pro trial with NO card on file
//     (via the start-trial edge function). Conversion depends on the user
//     manually returning and entering card details at day 14 — which is why
//     0/86 have converted.
//
//   true (card-required model):
//     No trials are auto-granted. To start the 14-day trial a new user must
//     complete a Lemon Squeezy checkout that captures their card ($0 today),
//     and LS auto-charges $19 on day 14 unless they cancel. Existing users
//     with a trial row are grandfathered — this flag only affects users who
//     have never had a subscription row.
//
// DO NOT flip this to true until the Pro Monthly + Annual variants in the
// Lemon Squeezy dashboard have a 14-day trial period configured. Flipping it
// first would charge new users $19 immediately instead of starting a trial.
export const CARD_REQUIRED = false;

// Trial length in days — kept in sync with the LS variant trial period and the
// start-trial edge function (TRIAL_DAYS there). Used for display copy only.
export const TRIAL_DAYS = 14;
