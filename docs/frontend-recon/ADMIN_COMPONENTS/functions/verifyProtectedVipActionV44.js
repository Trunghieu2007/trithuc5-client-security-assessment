function verifyProtectedVipActionV44(actionName, requiredPackKey, lessonOrExamId) {
            if (state.isAdminLoggedIn && state.adminPreviewUnlockAll) return true;
            if (lessonOrExamId && isFreeLesson(lessonOrExamId)) return true;

            const stu = state.loggedInStudent;
            if (!stu || stu.id === 'stu_free_12b1' || stu.id === 'stu_practice_e') {
                return false;
            }
            const ok = BackendVipAuthServiceV44.hasVerifiedPackageAccess(stu, requiredPackKey, actionName);
            if (ok) {
                BackendVipAuthServiceV44.verifyWithRemoteBackendAsync(stu);
            }
            return ok;
        }