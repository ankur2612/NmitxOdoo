#!/usr/bin/env bash
# End-to-end API test for the Dayflow HRMS backend.
# Usage:  bash test/e2e.sh          (expects the server running on :5000)
#         API=http://host/api bash test/e2e.sh

API="${API:-http://localhost:5000/api}"
BACKEND="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$BACKEND/test/.work"
mkdir -p "$WORK"

PASS=0
FAIL=0
FAILED_LIST=""
RUN="$(node -e "process.stdout.write(String(Date.now()).slice(-7))")"
CODE1="$(node -e "const a='ABCDEFGHIJKLMNOPQRSTUVWXYZ';process.stdout.write(a[Math.floor(Math.random()*26)]+a[Math.floor(Math.random()*26)])")"
CODE2="$(node -e "const a='ABCDEFGHIJKLMNOPQRSTUVWXYZ';process.stdout.write(a[Math.floor(Math.random()*26)]+a[Math.floor(Math.random()*26)])")"

BOLD=$'\033[1m'; DIM=$'\033[2m'; RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; OFF=$'\033[0m'

section() { printf "\n${BOLD}%s${OFF}\n" "$1"; }

# req METHOD PATH [TOKEN] [JSON] -> sets CODE and BODY
req() {
  local method="$1" path="$2" token="$3" data="$4"
  local args=(-s -o body -w "%{http_code}" -X "$method" "$API$path")
  [ -n "$token" ] && args+=(-H "Authorization: Bearer $token")
  [ -n "$data" ] && args+=(-H "Content-Type: application/json" -d "$data")
  CODE="$(curl "${args[@]}")"
  BODY="$(cat body 2>/dev/null)"
}

# upload METHOD PATH TOKEN FIELD FILE [extra -F args...]
upload() {
  local method="$1" path="$2" token="$3"; shift 3
  local args=(-s -o body -w "%{http_code}" -X "$method" "$API$path" -H "Authorization: Bearer $token")
  while [ $# -gt 0 ]; do args+=(-F "$1"); shift; done
  CODE="$(curl "${args[@]}")"
  BODY="$(cat body 2>/dev/null)"
}

# jget EXPR  -> reads $BODY, prints j.<EXPR>
jget() {
  printf '%s' "$BODY" | node -e "
let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{
  try { const j=JSON.parse(s); const v=eval('j.'+process.argv[1]);
        process.stdout.write(v===undefined||v===null?'':String(v)); }
  catch (e) { process.stdout.write(''); }
})" "$1"
}

ok()   { PASS=$((PASS+1)); printf "  ${GREEN}PASS${OFF}  %s\n" "$1"; }
bad()  { FAIL=$((FAIL+1)); FAILED_LIST="$FAILED_LIST\n    - $1"; printf "  ${RED}FAIL${OFF}  %s\n" "$1"; }

# status EXPECTED LABEL
status() {
  if [ "$CODE" = "$1" ]; then ok "[$CODE] $2"
  else bad "$2 (expected $1, got $CODE: $(printf '%s' "$BODY" | head -c 120))"; fi
}

# equals EXPECTED ACTUAL LABEL
equals() {
  if [ "$1" = "$2" ]; then ok "$3 = $2"
  else bad "$3 (expected '$1', got '$2')"; fi
}

printf "${BOLD}Dayflow HRMS — end-to-end API test${OFF}\n"
printf "${DIM}target: %s   run id: %s${OFF}\n" "$API" "$RUN"

cd "$WORK" || exit 1
req GET / "" ""
if [ "$CODE" = "000" ]; then
  printf "\n${RED}Server is not reachable at %s${OFF}\n" "$API"
  printf "Start it with:  cd backend && npm run dev\n"
  exit 1
fi

# Fixtures are written from inside $WORK with relative names: Windows node does not
# understand Git Bash paths, and MSYS does not translate paths inside a -e script.
cd "$WORK" || exit 1
node -e "
const fs=require('fs');
fs.writeFileSync('pic.png', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==','base64'));
fs.writeFileSync('big.png', Buffer.concat([Buffer.from('89504E470D0A1A0A','hex'), Buffer.alloc(6*1024*1024)]));
fs.writeFileSync('notes.txt','not an image');
"

# ---------------------------------------------------------------- 1. onboarding
section "1  Authentication and company onboarding"

req POST /auth/register-company "" "{\"companyName\":\"Odoo India\",\"companyCode\":\"$CODE1\",\"name\":\"Asha Menon\",\"email\":\"asha$RUN@dayflow.test\",\"phone\":\"9876543210\",\"password\":\"Secret123\",\"confirmPassword\":\"Secret123\"}"
status 201 "register company"
ADMIN_TOKEN="$(jget token)"; ADMIN_ID="$(jget user._id)"; COMPANY_ID="$(jget company._id)"
ADMIN_LOGIN="$(jget user.loginId)"
equals "${CODE1}ASME20260001" "$ADMIN_LOGIN" "admin login id format"
equals "" "$(jget user.passwordHash)" "password hash withheld"

req POST /auth/register-company "" "{\"companyName\":\"Dup Co\",\"name\":\"Dup Person\",\"email\":\"asha$RUN@dayflow.test\",\"password\":\"Secret123\"}"
status 409 "duplicate email rejected"

req POST /auth/register-company "" "{\"companyName\":\"Weak Co\",\"name\":\"Weak Person\",\"email\":\"weak$RUN@dayflow.test\",\"password\":\"abc\"}"
status 400 "short password rejected"

req POST /auth/register-company "" "{\"companyName\":\"Mismatch Co\",\"name\":\"M P\",\"email\":\"mm$RUN@dayflow.test\",\"password\":\"Secret123\",\"confirmPassword\":\"Secret124\"}"
status 400 "password confirmation mismatch rejected"

req POST /auth/register-company "" "{\"companyName\":\"Odoo Islands\",\"companyCode\":\"$CODE1\",\"name\":\"X Y\",\"email\":\"xy$RUN@dayflow.test\",\"password\":\"Secret123\"}"
status 409 "company code collision rejected"

req POST /auth/login "" "{\"identifier\":\"asha$RUN@dayflow.test\",\"password\":\"Secret123\"}"
status 200 "login by email"

req POST /auth/login "" "{\"identifier\":\"$(printf '%s' "$ADMIN_LOGIN" | tr 'A-Z' 'a-z')\",\"password\":\"Secret123\"}"
status 200 "login by login id (case insensitive)"

req POST /auth/login "" "{\"identifier\":\"asha$RUN@dayflow.test\",\"password\":\"WrongPass1\"}"
status 401 "wrong password rejected"
WRONG_MSG="$(jget message)"
req POST /auth/login "" "{\"identifier\":\"ghost$RUN@nowhere.test\",\"password\":\"Secret123\"}"
equals "$WRONG_MSG" "$(jget message)" "unknown user gives identical message (no enumeration)"

req GET /auth/me "$ADMIN_TOKEN" ""
status 200 "GET /auth/me"
equals "Odoo India" "$(jget user.company.name)" "me populates company"

req GET /auth/me "" ""
status 401 "me without token"
req GET /auth/me "not.a.real.token" ""
status 401 "me with malformed token"

# ------------------------------------------------------------- 2. seeded config
section "2  Company defaults seeded on signup"

req GET /leave-types "$ADMIN_TOKEN" ""
status 200 "list leave types"
equals "3" "$(jget leaveTypes.length)" "seeded leave type count"
PTO_ID="$(jget "leaveTypes.find(t=>t.name==='Paid Time Off')._id")"
SICK_ID="$(jget "leaveTypes.find(t=>t.name==='Sick Leave')._id")"
UNPAID_ID="$(jget "leaveTypes.find(t=>t.name==='Unpaid Leave')._id")"
equals "24" "$(jget "leaveTypes.find(t=>t.name==='Paid Time Off').defaultDays")" "Paid Time Off allowance"
equals "7" "$(jget "leaveTypes.find(t=>t.name==='Sick Leave').defaultDays")" "Sick Leave allowance"
equals "true" "$(jget "leaveTypes.find(t=>t.name==='Sick Leave').requiresAttachment")" "Sick Leave needs a document"

req GET /holidays "$ADMIN_TOKEN" ""
status 200 "list holidays"
equals "9" "$(jget count)" "seeded holiday count"
equals "Independence Day" "$(jget "holidays.find(h=>h.date==='2026-08-15').name")" "holiday lookup by date"

req GET /company "$ADMIN_TOKEN" ""
status 200 "GET /company"
equals "12" "$(jget company.settings.pfPercent)" "default PF percent"
equals "200" "$(jget company.settings.professionalTax)" "default professional tax"

upload POST /company/logo "$ADMIN_TOKEN" "logo=@pic.png;type=image/png"
status 200 "company logo upload"
LOGO_URL="$(jget logoUrl)"
[ -n "$LOGO_URL" ] && ok "logo url returned" || bad "logo url returned"

# ------------------------------------------------------------ 3. employee admin
section "3  Employee management"

req POST /employees "$ADMIN_TOKEN" "{\"firstName\":\"Ravi\",\"lastName\":\"Kumar\",\"workEmail\":\"ravi$RUN@dayflow.test\",\"jobPosition\":\"Backend Developer\",\"mobile\":\"9812345678\"}"
status 201 "create employee"
EMP_ID="$(jget employee._id)"; EMP_LOGIN="$(jget credentials.loginId)"; EMP_TEMP="$(jget credentials.tempPassword)"
equals "${CODE1}RAKU20260002" "$EMP_LOGIN" "employee login id + serial increment"
equals "true" "$(jget employee.mustChangePassword)" "temp password forces a change"
equals "employee" "$(jget employee.role)" "default role"
[ -n "$EMP_TEMP" ] && ok "temp password returned once" || bad "temp password returned once"

req POST /employees "$ADMIN_TOKEN" "{\"firstName\":\"Priya\",\"lastName\":\"Nair\",\"workEmail\":\"priya$RUN@dayflow.test\",\"jobPosition\":\"Designer\"}"
status 201 "create second employee"
EMP2_ID="$(jget employee._id)"
equals "${CODE1}PRNA20260003" "$(jget credentials.loginId)" "serial increments again"

req POST /employees "$ADMIN_TOKEN" "{\"firstName\":\"Dup\",\"workEmail\":\"ravi$RUN@dayflow.test\"}"
status 409 "duplicate employee email"
req POST /employees "$ADMIN_TOKEN" "{\"workEmail\":\"nofirst$RUN@dayflow.test\"}"
status 400 "missing firstName"
req POST /employees "$ADMIN_TOKEN" "{\"firstName\":\"Bad\",\"workEmail\":\"bad$RUN@dayflow.test\",\"department\":\"000000000000000000000000\"}"
status 400 "department must belong to company"

req GET /employees "$ADMIN_TOKEN" ""
status 200 "list employees"
equals "3" "$(jget count)" "employee count"
req GET "/employees?q=ravi" "$ADMIN_TOKEN" ""
equals "1" "$(jget count)" "search by name"
req GET "/employees?q=Designer" "$ADMIN_TOKEN" ""
equals "1" "$(jget count)" "search by job position"
req GET "/employees?q=.%2A" "$ADMIN_TOKEN" ""
equals "0" "$(jget count)" "regex injection escaped"

req GET "/employees/$EMP_ID" "$ADMIN_TOKEN" ""
status 200 "get employee by id"
equals "" "$(jget employee.salary)" "salary never on employee payload"
req GET /employees/not-an-objectid "$ADMIN_TOKEN" ""
status 400 "malformed id gives 400 not 500"
req GET /employees/000000000000000000000000 "$ADMIN_TOKEN" ""
status 404 "unknown id gives 404"

upload POST "/employees/$EMP_ID/avatar" "$ADMIN_TOKEN" "avatar=@pic.png;type=image/png"
status 200 "avatar upload"
AVATAR_URL="$(jget avatarUrl)"
upload POST "/employees/$EMP_ID/avatar" "$ADMIN_TOKEN" "avatar=@notes.txt;type=text/plain"
status 400 "non-image rejected"
upload POST "/employees/$EMP_ID/avatar" "$ADMIN_TOKEN" "avatar=@big.png;type=image/png"
status 400 "oversized image rejected"

# ------------------------------------------------------- 4. first-login journey
section "4  Employee first login and forced password change"

req POST /auth/login "" "{\"identifier\":\"$EMP_LOGIN\",\"password\":\"$EMP_TEMP\"}"
status 200 "login with temp password"
EMP_TOKEN="$(jget token)"
equals "true" "$(jget mustChangePassword)" "flagged to change password"

req POST /auth/change-password "$EMP_TOKEN" "{\"currentPassword\":\"WrongOne\",\"newPassword\":\"NewSecret123\"}"
status 401 "wrong current password"
req POST /auth/change-password "$EMP_TOKEN" "{\"currentPassword\":\"$EMP_TEMP\",\"newPassword\":\"abc\"}"
status 400 "new password too short"
req POST /auth/change-password "$EMP_TOKEN" "{\"currentPassword\":\"$EMP_TEMP\",\"newPassword\":\"$EMP_TEMP\"}"
status 400 "new password same as current"
req POST /auth/change-password "$EMP_TOKEN" "{\"currentPassword\":\"$EMP_TEMP\",\"newPassword\":\"NewSecret123\",\"confirmPassword\":\"NewSecret123\"}"
status 200 "change password"
equals "false" "$(jget user.mustChangePassword)" "flag cleared"

req POST /auth/login "" "{\"identifier\":\"$EMP_LOGIN\",\"password\":\"$EMP_TEMP\"}"
status 401 "old temp password revoked"
req POST /auth/login "" "{\"identifier\":\"$EMP_LOGIN\",\"password\":\"NewSecret123\"}"
status 200 "new password works"
EMP_TOKEN="$(jget token)"

# ------------------------------------------------------------- 5. profile edits
section "5  Profile permissions"

req PATCH "/employees/$EMP_ID" "$EMP_TOKEN" '{"mobile":"9999900000","privateInfo":{"address":"12 MG Road","bank":{"ifsc":"HDFC0001234"}},"resume":{"skills":["Node.js","MongoDB"]}}'
status 200 "employee edits own allowed fields"
equals "9999900000" "$(jget employee.mobile)" "mobile saved"
equals "HDFC0001234" "$(jget employee.privateInfo.bank.ifsc)" "nested bank field saved"

req PATCH "/employees/$EMP_ID" "$EMP_TOKEN" '{"role":"admin"}'
status 403 "privilege escalation blocked"
req PATCH "/employees/$EMP_ID" "$EMP_TOKEN" '{"jobPosition":"CEO"}'
status 403 "admin-only field blocked"
req PATCH "/employees/$EMP_ID" "$EMP_TOKEN" '{"isActive":false}'
status 403 "self-deactivation blocked"
req PATCH "/employees/$ADMIN_ID" "$EMP_TOKEN" '{"mobile":"1111111111"}'
status 403 "editing another employee blocked"
req PATCH "/employees/$EMP_ID" "$EMP_TOKEN" "{\"_id\":\"$EMP_ID\",\"loginId\":\"HACKED\",\"createdAt\":\"2020-01-01\",\"mobile\":\"9000000001\"}"
status 200 "echoed meta fields ignored"
equals "$EMP_LOGIN" "$(jget employee.loginId)" "login id immutable"

req PATCH "/employees/$EMP_ID" "$ADMIN_TOKEN" '{"jobPosition":"Senior Backend Developer","location":"Bengaluru"}'
status 200 "admin edits restricted fields"
req POST /employees "$EMP_TOKEN" "{\"firstName\":\"Sneaky\",\"workEmail\":\"sneaky$RUN@dayflow.test\"}"
status 403 "employee cannot create employees"

# --------------------------------------------------------------- 6. attendance
section "6  Attendance"

req POST /attendance/check-out "$EMP_TOKEN" ""
status 409 "check-out before check-in"
req POST /attendance/check-in "$EMP_TOKEN" ""
status 201 "check in"
req POST /attendance/check-in "$EMP_TOKEN" ""
status 409 "double check-in blocked"
req GET /attendance/today "$EMP_TOKEN" ""
status 200 "today status"
equals "true" "$(jget checkedIn)" "systray shows checked in"

req GET /employees "$ADMIN_TOKEN" ""
equals "present" "$(jget "employees.find(e=>e._id==='$EMP_ID').todayStatus")" "grid shows green/present"

req POST /attendance/check-out "$EMP_TOKEN" ""
status 200 "check out"
req POST /attendance/check-out "$EMP_TOKEN" ""
status 409 "double check-out blocked"

req GET /attendance/me "$EMP_TOKEN" ""
status 200 "employee month view"
equals "2026-08" "$(jget month)" "defaults to current month"
equals "31" "$(jget days.length)" "full month returned"
equals "Independence Day" "$(jget "days.find(d=>d.dateKey==='2026-08-15').holiday")" "holiday flagged in month"
equals "holiday" "$(jget "days.find(d=>d.dateKey==='2026-08-15').status")" "holiday not counted absent"
equals "weekend" "$(jget "days.find(d=>d.dateKey==='2026-08-16').status")" "sunday marked weekend"

req GET "/attendance/me?month=Oct-2026" "$EMP_TOKEN" ""
status 400 "bad month format rejected"
req GET "/attendance/me?employee=$ADMIN_ID" "$EMP_TOKEN" ""
status 403 "employee cannot read another calendar"

req GET /attendance "$ADMIN_TOKEN" ""
status 200 "admin day view"
equals "3" "$(jget summary.total)" "all employees listed"
req GET /attendance "$EMP_TOKEN" ""
status 403 "employee blocked from admin day view"
req GET "/attendance?date=13-08-2026" "$ADMIN_TOKEN" ""
status 400 "bad date format rejected"

# ----------------------------------------------------------------- 7. time off
section "7  Time off"

req GET /leaves/balance "$EMP_TOKEN" ""
status 200 "leave balance"
equals "24" "$(jget "balances.find(b=>b.leaveType.name==='Paid Time Off').allocatedDays")" "auto allocation on hire"

req POST /leaves "$EMP_TOKEN" "{\"leaveType\":\"$PTO_ID\",\"startDate\":\"2026-09-07\",\"endDate\":\"2026-09-09\"}"
status 201 "apply for paid time off"
LEAVE_ID="$(jget leave._id)"
equals "3" "$(jget leave.days)" "mon-wed counts 3 days"
equals "pending" "$(jget leave.status)" "starts pending"

req POST /leaves "$EMP_TOKEN" "{\"leaveType\":\"$PTO_ID\",\"startDate\":\"2026-09-11\",\"endDate\":\"2026-09-14\"}"
status 201 "apply across a weekend"
WEEKEND_LEAVE="$(jget leave._id)"
equals "2" "$(jget leave.days)" "fri-mon counts 2 working days"

req POST /leaves "$EMP_TOKEN" "{\"leaveType\":\"$PTO_ID\",\"startDate\":\"2026-08-13\",\"endDate\":\"2026-08-17\"}"
status 201 "apply across a holiday"
equals "3" "$(jget leave.days)" "holiday and weekend excluded"

req POST /leaves "$EMP_TOKEN" "{\"leaveType\":\"$PTO_ID\",\"startDate\":\"2026-09-08\",\"endDate\":\"2026-09-10\"}"
status 409 "overlapping request blocked"
req POST /leaves "$EMP_TOKEN" "{\"leaveType\":\"$PTO_ID\",\"startDate\":\"2026-09-19\",\"endDate\":\"2026-09-20\"}"
status 400 "all-weekend range rejected"
req POST /leaves "$EMP_TOKEN" "{\"leaveType\":\"$PTO_ID\",\"startDate\":\"2026-10-10\",\"endDate\":\"2026-10-05\"}"
status 400 "reversed date range rejected"
req POST /leaves "$EMP_TOKEN" "{\"leaveType\":\"$SICK_ID\",\"startDate\":\"2026-10-05\",\"endDate\":\"2026-10-05\"}"
status 400 "sick leave without certificate rejected"

upload POST /leaves "$EMP_TOKEN" "leaveType=$SICK_ID" "startDate=2026-10-05" "endDate=2026-10-05" "attachment=@pic.png;type=image/png"
status 201 "sick leave with certificate"
[ -n "$(jget leave.attachmentUrl)" ] && ok "certificate stored on cloudinary" || bad "certificate stored on cloudinary"

req GET "/leaves?status=pending" "$ADMIN_TOKEN" ""
status 200 "admin approval queue"
equals "4" "$(jget count)" "pending requests listed"
req GET /leaves "$EMP_TOKEN" ""
status 403 "employee blocked from company-wide list"
req GET /leaves/me "$EMP_TOKEN" ""
status 200 "employee sees own requests"

req PATCH "/leaves/$LEAVE_ID/approve" "$EMP_TOKEN" ""
status 403 "employee cannot approve"
req PATCH "/leaves/$LEAVE_ID/approve" "$ADMIN_TOKEN" ""
status 200 "admin approves with no request body"
equals "approved" "$(jget leave.status)" "status approved"

req GET /leaves/balance "$EMP_TOKEN" ""
equals "21" "$(jget "balances.find(b=>b.leaveType.name==='Paid Time Off').remainingDays")" "balance decremented"

req PATCH "/leaves/$LEAVE_ID/approve" "$ADMIN_TOKEN" ""
status 409 "approving twice blocked"

req PATCH "/leaves/$LEAVE_ID/reject" "$ADMIN_TOKEN" '{"comment":"Reversed"}'
status 200 "approved request reversed to rejected"
req GET /leaves/balance "$EMP_TOKEN" ""
equals "24" "$(jget "balances.find(b=>b.leaveType.name==='Paid Time Off').remainingDays")" "balance restored on reversal"

req PATCH "/leaves/$LEAVE_ID/approve" "$ADMIN_TOKEN" ""
status 200 "re-approved"
req GET /leaves/balance "$EMP_TOKEN" ""
equals "21" "$(jget "balances.find(b=>b.leaveType.name==='Paid Time Off').remainingDays")" "no double counting"

req POST /leaves "$EMP_TOKEN" "{\"leaveType\":\"$PTO_ID\",\"startDate\":\"2026-11-02\",\"endDate\":\"2026-12-31\"}"
status 400 "insufficient balance rejected"

req DELETE "/leaves/$WEEKEND_LEAVE" "$EMP_TOKEN" ""
status 200 "employee cancels own pending request"
req DELETE "/leaves/$LEAVE_ID" "$EMP_TOKEN" ""
status 409 "cannot cancel an approved request"

# ------------------------------------------------------------------ 8. payroll
section "8  Salary"

req GET "/employees/salary/preview?wage=50000" "$ADMIN_TOKEN" ""
status 200 "salary preview"
equals "25000" "$(jget preview.basic)" "basic = 50% of wage"

req PUT "/employees/$EMP_ID/salary" "$ADMIN_TOKEN" '{"monthlyWage":50000}'
status 200 "set salary structure"
equals "600000" "$(jget salary.yearlyWage)" "yearly wage"
equals "25000" "$(jget "salary.components.find(c=>c.name==='Basic Salary').amount")" "Basic Salary"
equals "12500" "$(jget "salary.components.find(c=>c.name==='House Rent Allowance').amount")" "House Rent Allowance"
equals "4167" "$(jget "salary.components.find(c=>c.name==='Standard Allowance').amount")" "Standard Allowance"
equals "2082.5" "$(jget "salary.components.find(c=>c.name==='Performance Bonus').amount")" "Performance Bonus"
equals "2082.5" "$(jget "salary.components.find(c=>c.name==='Leave Travel Allowance').amount")" "Leave Travel Allowance"
equals "3000" "$(jget salary.pf.employeeAmount)" "PF employee"
equals "3000" "$(jget salary.pf.employerAmount)" "PF employer"
equals "200" "$(jget salary.professionalTax)" "professional tax"
equals "50000" "$(jget "salary.components.reduce((s,c)=>s+c.amount,0)")" "components total exactly the wage"

req PUT "/employees/$EMP_ID/salary" "$ADMIN_TOKEN" '{"monthlyWage":80000}'
status 200 "wage change recomputes"
equals "40000" "$(jget "salary.components.find(c=>c.name==='Basic Salary').amount")" "basic rescaled"
equals "4800" "$(jget salary.pf.employeeAmount)" "PF rescaled"

req GET "/employees/$EMP_ID/salary" "$ADMIN_TOKEN" ""
status 200 "read salary back"
equals "80000" "$(jget salary.monthlyWage)" "salary persisted"

req PUT "/employees/$EMP_ID/salary" "$ADMIN_TOKEN" '{"monthlyWage":10000,"components":[{"name":"Basic Salary","computationType":"fixed","value":99999}]}'
status 400 "components over wage rejected"
req GET "/employees/$EMP_ID/salary" "$EMP_TOKEN" ""
status 403 "employee cannot read salary"
req PUT "/employees/$EMP_ID/salary" "$EMP_TOKEN" '{"monthlyWage":999999}'
status 403 "employee cannot write salary"

# ----------------------------------------------------------------- 9. settings
section "9  Settings: departments, leave types, allocations, holidays"

req POST /departments "$ADMIN_TOKEN" '{"name":"Engineering"}'
status 201 "create department"
DEPT_ID="$(jget department._id)"
req POST /departments "$ADMIN_TOKEN" '{"name":"Engineering"}'
status 409 "duplicate department name"
equals "name is already in use" "$(jget message)" "duplicate names the right field"
req POST /departments "$EMP_TOKEN" '{"name":"Shadow IT"}'
status 403 "employee cannot create departments"
req GET /departments "$EMP_TOKEN" ""
status 200 "employee can read departments"

req PATCH "/employees/$EMP_ID" "$ADMIN_TOKEN" "{\"department\":\"$DEPT_ID\"}"
status 200 "assign employee to department"

req POST /leave-types "$ADMIN_TOKEN" '{"name":"Work From Home","isPaid":true,"defaultDays":10}'
status 201 "create leave type"
WFH_ID="$(jget leaveType._id)"
req PATCH "/leave-types/$WFH_ID" "$ADMIN_TOKEN" '{"defaultDays":12}'
status 200 "update leave type"
equals "12" "$(jget leaveType.defaultDays)" "leave type updated"

req POST /allocations "$ADMIN_TOKEN" "{\"employee\":\"$EMP_ID\",\"leaveType\":\"$PTO_ID\",\"year\":2026,\"allocatedDays\":30}"
status 200 "raise allocation"
equals "30" "$(jget allocation.allocatedDays)" "allocation raised"
req POST /allocations "$ADMIN_TOKEN" "{\"employee\":\"$EMP_ID\",\"leaveType\":\"$PTO_ID\",\"year\":2026,\"allocatedDays\":1}"
status 400 "allocation below used days rejected"
req GET /leaves/balance "$EMP_TOKEN" ""
equals "30" "$(jget "balances.find(b=>b.leaveType.name==='Paid Time Off').allocatedDays")" "rejected allocation not persisted"
req GET "/allocations?year=2026" "$ADMIN_TOKEN" ""
status 200 "list allocations"
req GET /allocations "$EMP_TOKEN" ""
status 403 "employee blocked from allocations admin"

req POST /holidays "$ADMIN_TOKEN" '{"name":"Company Offsite","date":"2026-12-24"}'
status 201 "create holiday"
HOLIDAY_ID="$(jget holiday._id)"
req POST /holidays "$ADMIN_TOKEN" '{"name":"Dup","date":"2026-12-24"}'
status 409 "duplicate holiday date"
req POST /holidays "$ADMIN_TOKEN" '{"name":"Bad","date":"24-12-2026"}'
status 400 "bad holiday date format"
req DELETE "/holidays/$HOLIDAY_ID" "$ADMIN_TOKEN" ""
status 200 "delete holiday"
req DELETE "/holidays/$HOLIDAY_ID" "$ADMIN_TOKEN" ""
status 404 "deleting twice gives 404"

# -------------------------------------------------------------- 10. isolation
section "10  Multi-tenant isolation"

req POST /auth/register-company "" "{\"companyName\":\"Rival Inc\",\"companyCode\":\"$CODE2\",\"name\":\"Mallory Snoop\",\"email\":\"mallory$RUN@rival.test\",\"password\":\"Secret123\"}"
status 201 "register rival company"
RIVAL_TOKEN="$(jget token)"

req GET "/employees/$EMP_ID" "$RIVAL_TOKEN" ""
status 404 "rival cannot read our employee"
req PATCH "/employees/$EMP_ID" "$RIVAL_TOKEN" '{"jobPosition":"Owned"}'
status 404 "rival cannot edit our employee"
req GET "/employees/$EMP_ID/salary" "$RIVAL_TOKEN" ""
status 404 "rival cannot read our salary"
req GET /employees "$RIVAL_TOKEN" ""
equals "1" "$(jget count)" "rival sees only their own roster"
req GET "/leaves/$LEAVE_ID" "$RIVAL_TOKEN" ""
req PATCH "/leaves/$LEAVE_ID/approve" "$RIVAL_TOKEN" ""
status 404 "rival cannot approve our leave"
req GET /holidays "$RIVAL_TOKEN" ""
equals "9" "$(jget count)" "rival gets their own seeded holidays"

# ------------------------------------------------------------ 11. api hygiene
section "11  API hygiene"

req GET /nope/nothing "$ADMIN_TOKEN" ""
status 404 "unknown route returns JSON 404"
[ -n "$(jget message)" ] && ok "404 body is JSON" || bad "404 body is JSON"

for ep in "POST /auth/login" "POST /employees" "POST /departments" "POST /holidays" "POST /leaves" "POST /allocations" "POST /auth/change-password"; do
  m="${ep%% *}"; p="${ep#* }"
  req "$m" "$p" "$ADMIN_TOKEN" ""
  if [ "$CODE" = "400" ]; then ok "[400] $m $p with no body"
  else bad "$m $p with no body (expected 400, got $CODE)"; fi
done
req PUT "/employees/$EMP_ID/salary" "$ADMIN_TOKEN" ""
status 400 "PUT salary with no body"

# ------------------------------------------------------------ 12. consistency
section "12  Data consistency"

req GET /leaves/balance "$EMP_TOKEN" ""
STORED_USED="$(jget "balances.find(b=>b.leaveType.name==='Paid Time Off').usedDays")"
req GET "/leaves/me?year=2026" "$EMP_TOKEN" ""
TRUE_USED="$(jget "leaves.filter(l=>l.status==='approved'&&l.leaveType.name==='Paid Time Off').reduce((s,l)=>s+l.days,0)")"
equals "$TRUE_USED" "$STORED_USED" "usedDays matches sum of approved leave"

req GET /employees "$ADMIN_TOKEN" ""
equals "3" "$(jget count)" "roster unchanged after all operations"

# ------------------------------------------------------------------- teardown
section "Cleanup"
cd "$BACKEND" || exit 1
node -e "
require('dotenv').config({quiet:true});
const connectDB=require('./config/db');
const models=['Company','Employee','Department','SalaryStructure','Attendance','LeaveType','LeaveAllocation','LeaveRequest','Holiday','Counter'];
const M={};for(const m of models) M[m]=require('./models/'+m);
(async()=>{
  await connectDB();
  const ids=['$COMPANY_ID'];
  const rivals=await M.Company.find({code:'$CODE2'}).select('_id').lean();
  for(const r of rivals) ids.push(String(r._id));
  let removed=0;
  for(const name of models){
    if(name==='Counter') continue;
    const r=await M[name].deleteMany({company:{\$in:ids}});
    removed+=r.deletedCount;
  }
  await M.Company.deleteMany({_id:{\$in:ids}});
  await M.Counter.deleteMany({_id:{\$regex:'^('+ids.join('|')+')'}});
  console.log('  removed '+removed+' test documents across '+ids.length+' companies');
  process.exit(0);
})();" 2>&1 | grep -v 'MONGOOSE\|MongoDB connected'
rm -rf "$WORK"

TOTAL=$((PASS+FAIL))
printf "\n${BOLD}%s${OFF}\n" "────────────────────────────────────────────"
if [ "$FAIL" -eq 0 ]; then
  printf "${GREEN}${BOLD}ALL %d CHECKS PASSED${OFF}\n" "$TOTAL"
  exit 0
else
  printf "${RED}${BOLD}%d of %d checks FAILED${OFF}" "$FAIL" "$TOTAL"
  printf "${RED}%b${OFF}\n" "$FAILED_LIST"
  exit 1
fi
