// ============================================
// CREATHON 2026 - Admin Panel JavaScript
// Firebase Auth (Login) + Supabase (Data)
// ============================================

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 4000);
}

// ----------------------------------------
// LOGIN
// ----------------------------------------
(function initLogin() {
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');

    if (!loginForm) return;

    // Check if already logged in via Firebase Auth
    if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged(user => {
            if (user) {
                loginSection.style.display = 'none';
                dashboardSection.style.display = 'block';
                loadRegistrations();
            }
        });
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.style.display = 'none';

        const email = document.getElementById('admin-email').value.trim();
        const password = document.getElementById('admin-password').value;

        try {
            if (typeof auth === 'undefined' || !auth) {
                throw { code: 'firebase-not-configured' };
            }
            await auth.signInWithEmailAndPassword(email, password);
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'block';
            loadRegistrations();
            showToast('Logged in successfully!');
        } catch (err) {
            loginError.style.display = 'block';
            if (err.code === 'firebase-not-configured') {
                loginError.textContent = '⚠️ Firebase not configured. Update firebase-config.js first.';
            } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                loginError.textContent = 'Invalid email or password.';
            } else if (err.code === 'auth/invalid-email') {
                loginError.textContent = 'Please enter a valid email address.';
            } else {
                loginError.textContent = 'Login failed. Please try again.';
            }
        }
    });
})();

// ----------------------------------------
// SUPABASE DATA FETCHING
// ----------------------------------------
let registrations = []; // This will hold grouped teams
let rawMembers = []; // Flat list of members

async function loadRegistrations() {
    const tbody = document.getElementById('registrations-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="9" class="text-center py-16 text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-3"><svg class="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Loading live registrations...</td></tr>';

    try {
        if (typeof window.supabaseClient === 'undefined' || !window.supabaseClient) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center py-8 text-red-500 font-bold">⚠️ Supabase not configured.</td></tr>';
            return;
        }

        // Fetch teams inside Supabase (order by newest first)
        const { data: teamsData, error: teamsError } = await window.supabaseClient
            .from('teams')
            .select('*')
            .order('created_at', { ascending: false });

        if (teamsError) throw teamsError;

        // Fetch all members
        const { data: membersData, error: membersError } = await window.supabaseClient
            .from('members')
            .select('*')
            .order('member_id', { ascending: true }); // Ensures Leader is usually first if inserted first

        if (membersError) throw membersError;

        // Group members by team
        registrations = [];
        rawMembers = membersData;

        teamsData.forEach(team => {
            const teamMembers = membersData.filter(m => m.team_id === team.team_id);
            // Sort so Leader is always first, then Members 1, 2, 3
            teamMembers.sort((a, b) => {
                if (a.role === 'Leader') return -1;
                if (b.role === 'Leader') return 1;
                return a.member_id - b.member_id;
            });

            if (teamMembers.length > 0) {
                // Determine member indexes 1, 2, 3 for labels
                let memberCount = 1;
                teamMembers.forEach(m => {
                    if (m.role !== 'Leader') {
                        m.displayRole = `Member ${memberCount}`;
                        memberCount++;
                    } else {
                        m.displayRole = 'Team Leader';
                    }
                });

                registrations.push({
                    team_id: team.team_id,
                    team_name: team.team_name,
                    created_at: team.created_at,
                    members: teamMembers
                });
            }
        });

        renderTable();
        updateStats();
    } catch (err) {
        console.error('Error loading registrations:', err);
        tbody.innerHTML = '<tr><td colspan="9" class="text-center text-red-500 py-8 font-bold">Error loading data. Check console.</td></tr>';
    }
}

function renderTable() {
    const tbody = document.getElementById('registrations-body');
    if (registrations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-12 text-slate-500 font-bold">No registrations yet.</td></tr>';
        return;
    }

    let html = '';
    let teamCounter = 1;

    registrations.forEach(team => {
        const dateStr = team.created_at ? new Date(team.created_at).toLocaleString('en-IN', {
            day: 'numeric', month: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
        }) : 'N/A';

        team.members.forEach((member, mIndex) => {
            const isLeaderRow = mIndex === 0;
            const teamNameCell = isLeaderRow ? `<strong>${teamCounter}. ${escapeHtml(team.team_name)}</strong>` : '';
            const dateCell = isLeaderRow ? dateStr : '';

            // Only show the delete button on the first row of the team, and it deletes the entire team
            const actionCell = isLeaderRow ? `<button class="text-xs bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1 rounded-md font-bold transition-colors" onclick="deleteTeam(${team.team_id})">Delete Team</button>` : '';

            // Border top only for the first row of a team
            const rowClass = isLeaderRow ? 'border-t-2 border-slate-200 bg-slate-50/50' : 'border-t border-slate-100 bg-white/50';

            html += `
            <tr class="${rowClass} hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4">${teamNameCell}</td>
                <td class="px-6 py-4 text-slate-600">${escapeHtml(member.displayRole)}</td>
                <td class="px-6 py-4 font-bold text-slate-800">${escapeHtml(member.name)}</td>
                <td class="px-6 py-4 font-mono text-xs text-slate-600 uppercase tracking-widest bg-slate-100 rounded">${escapeHtml(member.roll_number)}</td>
                <td class="px-6 py-4 text-center">${escapeHtml(member.year)}</td>
                <td class="px-6 py-4 text-center font-bold">${escapeHtml(member.section)}</td>
                <td class="px-6 py-4 text-blue-600">${escapeHtml(member.email)}</td>
                <td class="px-6 py-4 text-slate-500">${dateCell}</td>
                <td class="px-6 py-4 text-right">${actionCell}</td>
            </tr>`;
        });
        teamCounter++;
    });

    tbody.innerHTML = html;
}

function updateStats() {
    document.getElementById('stat-teams').textContent = registrations.length;
    document.getElementById('stat-participants').textContent = rawMembers.length;

    const sections = new Set();
    rawMembers.forEach(m => {
        if (m.section) sections.add(m.section);
    });

    document.getElementById('stat-sections').textContent = sections.size;
}

// ----------------------------------------
// DELETE TEAM (Cascade deletes members in Supabase)
// ----------------------------------------
window.deleteTeam = async function (teamId) {
    if (!confirm('Are you sure you want to delete this ENTIRE TEAM? This action cannot be undone.')) return;

    try {
        const { error } = await window.supabaseClient.from('teams').delete().eq('team_id', teamId);
        if (error) throw error;

        showToast('Team deleted successfully. Related members were cascaded.');
        loadRegistrations();
    } catch (err) {
        console.error('Delete error:', err);
        showToast('Failed to delete. Try again.', 'error');
    }
};

// ----------------------------------------
// EXPORT EXCEL (.xlsx)
// ----------------------------------------
document.getElementById('export-excel-btn')?.addEventListener('click', () => {
    if (registrations.length === 0) {
        showToast('No data to export.', 'error');
        return;
    }

    try {
        const data = [];
        let teamCounter = 1;

        registrations.forEach(team => {
            const dateStr = team.created_at ? new Date(team.created_at).toLocaleString('en-IN', {
                day: 'numeric', month: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
            }) : '';

            team.members.forEach((member, mIndex) => {
                const isLeaderRow = mIndex === 0;

                data.push({
                    'Team Name': isLeaderRow ? `${teamCounter}. ${team.team_name}` : '',
                    'Role': member.displayRole,
                    'Name': member.name,
                    'Roll No': member.roll_number,
                    'Year': member.year,
                    'Section': member.section,
                    'Email': member.email,
                    'Registered At': isLeaderRow ? dateStr : ''
                });
            });

            // Add an empty row between teams for spacing (optional, but looks good in excel)
            data.push({});
            teamCounter++;
        });

        const worksheet = XLSX.utils.json_to_sheet(data);

        // Adjust column widths
        const wscols = [
            { wch: 25 }, // Team Name
            { wch: 15 }, // Role
            { wch: 25 }, // Name
            { wch: 15 }, // Roll No
            { wch: 8 },  // Year
            { wch: 8 },  // Section
            { wch: 30 }, // Email
            { wch: 22 }  // Registered At
        ];
        worksheet['!cols'] = wscols;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

        XLSX.writeFile(workbook, `Creathon_2026_Teams_${new Date().toISOString().slice(0, 10)}.xlsx`);
        showToast('Excel file exported successfully! 📊');
    } catch (err) {
        console.error('Excel Export Error:', err);
        showToast('Failed to export Excel.', 'error');
    }
});

// ----------------------------------------
// EXPORT CSV
// ----------------------------------------
document.getElementById('export-csv-btn')?.addEventListener('click', () => {
    if (registrations.length === 0) {
        showToast('No data to export.', 'error');
        return;
    }

    const headers = ['Team Name', 'Role', 'Name', 'Roll No', 'Year', 'Section', 'Email', 'Registered At'];
    const rows = [];
    let teamCounter = 1;

    registrations.forEach(team => {
        const dateStr = team.created_at ? new Date(team.created_at).toLocaleString('en-IN') : '';

        team.members.forEach((member, mIndex) => {
            const isLeaderRow = mIndex === 0;
            rows.push([
                isLeaderRow ? `"${teamCounter}. ${team.team_name}"` : '""',
                `"${member.displayRole}"`,
                `"${member.name}"`,
                `"${member.roll_number}"`,
                `"${member.year}"`,
                `"${member.section}"`,
                `"${member.email}"`,
                isLeaderRow ? `"${dateStr}"` : '""'
            ].join(','));
        });

        rows.push(''); // Empty line between teams
        teamCounter++;
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Creathon_2026_Teams_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported successfully! 📥');
});

// ----------------------------------------
// REFRESH & LOGOUT
// ----------------------------------------
document.getElementById('refresh-btn')?.addEventListener('click', () => {
    loadRegistrations();
    showToast('Data refreshed!');
});

document.getElementById('logout-btn')?.addEventListener('click', async () => {
    try {
        await auth.signOut();
        document.getElementById('login-section').style.display = 'flex';
        document.getElementById('dashboard-section').style.display = 'none';
        showToast('Logged out successfully.');
    } catch (err) {
        console.error('Logout error:', err);
    }
});

// ----------------------------------------
// UTILITY
// ----------------------------------------
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

