# Quick Fix Checklist - Immediate Actions

## Step 1: Open Browser Console (F12)
Look for these logs when the page loads:

1. `[INIT] Component mounted/updated` - Should show courseId
2. `[EFFECT] Course data useEffect triggered` - Should show courseId exists
3. `[API] fetchLecturerCourseById` - Should show API call
4. `[DEBUG] Form state update` - Should show course data being set

## Step 2: Check Network Tab
Look for these API calls:

1. `GET /api/lecturer/courses/?lecturer_id={your_id}` 
   - Status should be 200
   - Response should contain course with matching id
   
2. `GET /api/departments/{deptId}/years/`
   - Status should be 200
   - Response should be `{years: [1,2,3,4]}`
   - If 404: deptId is wrong
   - If 401: Token issue

3. `GET /api/semesters/`
   - Status should be 200
   - Response should be `{semesters: ["A","B","SUMMER"]}`

## Step 3: Check localStorage
Open DevTools → Application → Local Storage → `http://localhost:3000`

Check `csmsUser` exists and has:
- `id`: Your user ID (number)
- `access` or `token`: JWT token string
- `department` or `department_id`: Department ID

## Step 4: Common Issues & Quick Fixes

### Issue: Course name/credits/department empty
**Check**: Console log `[API] fetchLecturerCourseById: Found course:`
- If `null`: Course not found → Check courseId matches your courses
- If object exists: Check if `name`, `credits`, `department_code` fields exist

### Issue: Study year dropdown empty/not working
**Check**: Console log `[DEBUG] Final yearsList to set:`
- If empty `[]`: API call failed or deptId wrong
- Check Network tab for `/api/departments/{deptId}/years/` call
- If 404: Department ID is incorrect
- If 401: Token expired - log out and log back in

### Issue: Semester doesn't stay selected
**Check**: Console log `[DEBUG] Semester onChange:`
- Should show old/new values
- Verify `form.semester` matches option `value` (both strings)

## Step 5: Manual Test
1. Open console
2. Type: `JSON.parse(localStorage.getItem("csmsUser"))`
3. Check your `id` and `department_id`
4. Navigate to: `/lecturer/courses`
5. Click on a course
6. Check URL: Should be `/lecturer/courses/{courseId}/new`
7. Check console logs immediately

## If Still Not Working:
Share these with me:
1. Console logs (copy all `[DEBUG]` and `[API]` logs)
2. Network tab screenshot (showing failed requests)
3. localStorage `csmsUser` (remove token before sharing)


