# Recly Agent Notes

## Structure
- `routes/` contains the active Express handlers mounted from `app.js`.
- `services/` contains response shaping and orchestration logic.
- `dao/` contains MySQL access through `db/createconnection.js`.
- `controllers/` is currently being phased out in favor of route-local handlers.

## Recruiter Endpoints
- `GET /recruiter/:recruiterid`
  - Returns a single recruiter from `recruiter_profile`.
- `GET /recruiter/company/search/:search`
  - Returns company dropdown options for autocomplete.
  - Searches `domain` with a wildcard match.
- `GET /recruiter/company/:companyId/recruiters`
  - Returns recruiters for the selected company id.
- `GET /recruiter/domain/:domain`
  - Returns recruiters for the selected domain.

## Notes
- The domain route must stay above `/recruiter/:recruiterid` in `routes/index.js`.
- Autocomplete and recruiter lookup use the same shared DB table shape used in `recruiter-api`: `recruiter_profile` with `company_id`, `organisation`, `domain`, and `status`.
