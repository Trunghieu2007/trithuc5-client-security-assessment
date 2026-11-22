function computeTeacherVipApprovalSealV44(u) {
            if (!u) return '';
            const vp = u.vipPackages || {};
            const maxD = Math.max(1, Math.min(3, Number(u.maxDevices || 2)));
            const admSecret = state.vaultLockConfig?.adminPassHash || DEFAULT_VAULT_PASS_HASH_V45;
            const raw = `TT50_VIP_SEAL_V44|${String(u.username || '').toLowerCase()}|${String(u.name || '').trim()}|${String(u.class || '').trim()}|${vp.k12?1:0}${vp.k11?1:0}${vp.k10?1:0}${vp.luyende?1:0}|MAXD:${maxD}|${admSecret}|THAY_TRUNG_MASTER_SEAL_2026`;
            return 'vseal44_' + hashStringHex(raw);
        }