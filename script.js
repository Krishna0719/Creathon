// ============================================
// CREATHON 2026 - Light Theme 3D Hero + Animations
// Three.js + Sliding Effects + Firebase
// ============================================

// ----------------------------------------
// THREE.JS 3D HERO SCENE (Light Theme)
// ----------------------------------------
(function initHero3D() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xf8fafc, 0.012); // Matches slate-50 background

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 45;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // Transparent to let tailwind gradients show

    // Core Geometry
    const coreGeo = new THREE.IcosahedronGeometry(4, 2);
    // Darker, richer purple for light background
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x6d28d9, wireframe: true, transparent: true, opacity: 0.15 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    const innerCoreGeo = new THREE.OctahedronGeometry(2, 0);
    // Vibrant blue
    const innerCoreMat = new THREE.MeshBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.3 });
    const innerCore = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    scene.add(innerCore);

    // Particles system
    const particlesCount = 2000;
    const posArray = new Float32Array(particlesCount * 3);
    const colorsArray = new Float32Array(particlesCount * 3);
    const velocities = new Float32Array(particlesCount * 3);

    const colorBlue = new THREE.Color(0x2563eb); // primary blue
    const colorPurple = new THREE.Color(0x7c3aed); // primary purple
    const colorCyan = new THREE.Color(0x0891b2); // primary cyan

    for (let i = 0; i < particlesCount * 3; i += 3) {
        // distribute in a wide sphere
        const r = 20 + Math.random() * 80;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);

        posArray[i] = r * Math.sin(phi) * Math.cos(theta);
        posArray[i + 1] = r * Math.sin(phi) * Math.sin(theta);
        posArray[i + 2] = r * Math.cos(phi);

        velocities[i] = (Math.random() - 0.5) * 0.02;
        velocities[i + 1] = (Math.random() - 0.5) * 0.02;
        velocities[i + 2] = (Math.random() - 0.5) * 0.02;

        const mixedColor = [colorBlue, colorPurple, colorCyan][Math.floor(Math.random() * 3)];
        colorsArray[i] = mixedColor.r;
        colorsArray[i + 1] = mixedColor.g;
        colorsArray[i + 2] = mixedColor.b;
    }

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeo.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));

    const particleMaterial = new THREE.PointsMaterial({
        size: 0.35,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        depthWrite: false
        // Removed additive blending for better contrast on light mode
    });

    const particlesMesh = new THREE.Points(particlesGeo, particleMaterial);
    scene.add(particlesMesh);

    // Connecting Lines
    const linesGeo = new THREE.BufferGeometry();
    const lineCount = 150;
    const linePos = new Float32Array(lineCount * 3 * 2);
    // Random points connected to center
    for (let i = 0; i < lineCount; i++) {
        linePos[i * 6] = 0; linePos[i * 6 + 1] = 0; linePos[i * 6 + 2] = 0;
        linePos[i * 6 + 3] = (Math.random() - 0.5) * 100;
        linePos[i * 6 + 4] = (Math.random() - 0.5) * 100;
        linePos[i * 6 + 5] = (Math.random() - 0.5) * 100;
    }
    linesGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    const lineMat = new THREE.LineBasicMaterial({ color: 0x0891b2, transparent: true, opacity: 0.08 });
    const lines = new THREE.LineSegments(linesGeo, lineMat);
    scene.add(lines);

    let mouseX = 0;
    let mouseY = 0;
    let currentScrollY = window.scrollY;

    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    document.addEventListener('scroll', () => {
        currentScrollY = window.scrollY;
    });

    let clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        // Rotate cores
        core.rotation.y = elapsedTime * 0.2;
        core.rotation.x = elapsedTime * 0.1;
        innerCore.rotation.y = -elapsedTime * 0.5;
        innerCore.rotation.z = elapsedTime * 0.3;

        // Rotate groups
        particlesMesh.rotation.y = elapsedTime * 0.03;
        particlesMesh.rotation.z = elapsedTime * 0.01;
        lines.rotation.y = -elapsedTime * 0.02;

        // Move individual particles for "flowing" effect
        const posAttrib = particlesGeo.attributes.position;
        const posArr = posAttrib.array;
        for (let i = 0; i < particlesCount; i++) {
            posArr[i * 3] += velocities[i * 3];
            posArr[i * 3 + 1] += velocities[i * 3 + 1];
            posArr[i * 3 + 2] += velocities[i * 3 + 2];

            // Constrain particles to a box bounds to loop them
            if (Math.abs(posArr[i * 3]) > 60) velocities[i * 3] *= -1;
            if (Math.abs(posArr[i * 3 + 1]) > 60) velocities[i * 3 + 1] *= -1;
            if (Math.abs(posArr[i * 3 + 2]) > 60) velocities[i * 3 + 2] *= -1;
        }
        posAttrib.needsUpdate = true;

        // Camera dynamics: parallax on mouse + parallax on scroll
        // Slowly drift camera based on scroll percentage
        const scrollOffset = (currentScrollY * 0.01);

        camera.position.x += (mouseX * 15 - camera.position.x) * 0.05;
        camera.position.y += (-mouseY * 15 - scrollOffset - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
})();

// ----------------------------------------
// NAVBAR
// ----------------------------------------
(function () {
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
    const menuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            const isOpen = navLinks.style.display === 'flex';
            navLinks.style.display = isOpen ? 'none' : 'flex';
            if (!isOpen) {
                navLinks.style.cssText = 'display:flex;flex-direction:column;position:absolute;top:100%;left:0;right:0;background:rgba(255,255,255,0.98);padding:20px;gap:16px;backdrop-filter:blur(20px);border-bottom:1px solid rgba(0,0,0,0.05);box-shadow:0 8px 32px rgba(0,0,0,0.08);';
            }
        });
    }
})();

// NRI text is static — no scroll expansion

// ----------------------------------------
// SCROLL REVEAL WITH SLIDING EFFECTS
// ----------------------------------------
(function () {
    // Add reveal classes to elements
    document.querySelectorAll('.about-card').forEach((el, i) => {
        el.classList.add('reveal', i % 2 === 0 ? 'reveal-left' : 'reveal-right');
    });
    document.querySelectorAll('.about-main').forEach(el => {
        el.classList.remove('reveal-left', 'reveal-right');
        el.classList.add('reveal-up');
    });
    document.querySelectorAll('.prize-card').forEach(el => {
        el.classList.add('reveal', 'reveal-scale');
    });
    document.querySelectorAll('.timeline-item').forEach((el, i) => {
        el.classList.add('reveal', i % 2 === 0 ? 'reveal-left' : 'reveal-right');
    });
    document.querySelectorAll('.contact-card').forEach(el => {
        el.classList.add('reveal', 'reveal-up');
    });
    document.querySelectorAll('.reg-form').forEach(el => {
        el.classList.add('reveal', 'reveal-scale');
    });
    document.querySelectorAll('.section-header').forEach(el => {
        el.classList.add('reveal', 'reveal-up');
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, idx) => {
            if (entry.isIntersecting) {
                // Stagger animation delay for siblings
                const parent = entry.target.parentElement;
                if (parent) {
                    const siblings = Array.from(parent.children).filter(c => c.classList.contains('reveal'));
                    const index = siblings.indexOf(entry.target);
                    entry.target.style.transitionDelay = `${index * 0.1}s`;
                }
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();

// ----------------------------------------
// SMOOTH SCROLL
// ----------------------------------------
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// ----------------------------------------
// TOAST
// ----------------------------------------
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 4000);
}

// ----------------------------------------
// REGISTRATION FORM + SUPABASE
// ----------------------------------------
(function () {
    const form = document.getElementById('registration-form');
    const msgDiv = document.getElementById('form-message');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        msgDiv.className = 'form-message';
        msgDiv.style.display = 'none';

        const teamName = document.getElementById('teamName').value.trim();
        const teamLeaderName = document.getElementById('teamLeaderName').value.trim();
        const rollNumber = document.getElementById('rollNumber').value.trim().toUpperCase();
        const leaderEmail = document.getElementById('leaderEmail').value.trim();
        const leaderYear = document.getElementById('leaderYear').value;
        const section = document.getElementById('section').value;

        const memberName1 = document.getElementById('memberName1').value.trim();
        const member1 = document.getElementById('member1').value.trim().toUpperCase();
        const member1Year = document.getElementById('member1Year').value;
        const member1Section = document.getElementById('member1Section').value;
        const member1Email = document.getElementById('member1Email').value.trim();

        const memberName2 = document.getElementById('memberName2').value.trim();
        const member2 = document.getElementById('member2').value.trim().toUpperCase();
        const member2Year = document.getElementById('member2Year').value;
        const member2Section = document.getElementById('member2Section').value;
        const member2Email = document.getElementById('member2Email').value.trim();

        const memberName3 = document.getElementById('memberName3').value.trim();
        const member3 = document.getElementById('member3').value.trim().toUpperCase();
        const member3Year = document.getElementById('member3Year').value;
        const member3Section = document.getElementById('member3Section').value;
        const member3Email = document.getElementById('member3Email').value.trim();

        const memberName4 = document.getElementById('memberName4') ? document.getElementById('memberName4').value.trim() : '';
        const member4 = document.getElementById('member4') ? document.getElementById('member4').value.trim().toUpperCase() : '';
        const member4Year = document.getElementById('member4Year') ? document.getElementById('member4Year').value : '';
        const member4Section = document.getElementById('member4Section') ? document.getElementById('member4Section').value : '';
        const member4Email = document.getElementById('member4Email') ? document.getElementById('member4Email').value.trim() : '';

        // Leader, Member 1, and Member 2 are strictly required!
        if (!teamName || !teamLeaderName || !rollNumber || !leaderEmail || !leaderYear || !section ||
            !memberName1 || !member1 || !member1Year || !member1Section || !member1Email ||
            !memberName2 || !member2 || !member2Year || !member2Section || !member2Email) {
            showFormMsg('Please fill in all required fields for the Leader, Member 1, and Member 2.', 'error');
            return;
        }

        const rolls = [rollNumber, member1, member2];
        if (member3) rolls.push(member3);
        if (member4) rolls.push(member4);
        if (new Set(rolls).size !== rolls.length) {
            showFormMsg('Duplicate roll numbers! Each member must have a unique roll number.', 'error');
            return;
        }

        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = true;
        submitBtn.querySelector('span').textContent = 'Submitting...';

        try {
            if (typeof window.supabaseClient === 'undefined' || !window.supabaseClient) throw new Error('Supabase not configured');

            // --- STEP 1: Insert Team Name into 'teams' table ---
            const { data: teamData, error: teamError } = await window.supabaseClient
                .from('teams')
                .insert([{ team_name: teamName }])
                .select()
                .single();

            if (teamError) throw teamError;
            const newTeamId = teamData.team_id;

            // --- STEP 2: Prepare Members Data List ---
            const membersPayload = [
                {
                    team_id: newTeamId,
                    role: 'Leader',
                    name: teamLeaderName,
                    roll_number: rollNumber,
                    year: leaderYear,
                    section: section,
                    email: leaderEmail
                },
                {
                    team_id: newTeamId,
                    role: 'Member',
                    name: memberName1,
                    roll_number: member1,
                    year: member1Year,
                    section: member1Section,
                    email: member1Email
                },
                {
                    team_id: newTeamId,
                    role: 'Member',
                    name: memberName2,
                    roll_number: member2,
                    year: member2Year,
                    section: member2Section,
                    email: member2Email
                }
            ];

            if (member3) {
                membersPayload.push({
                    team_id: newTeamId,
                    role: 'Member',
                    name: memberName3,
                    roll_number: member3,
                    year: member3Year,
                    section: member3Section,
                    email: member3Email
                });
            }

            if (member4) {
                membersPayload.push({
                    team_id: newTeamId,
                    role: 'Member',
                    name: memberName4,
                    roll_number: member4,
                    year: member4Year,
                    section: member4Section,
                    email: member4Email
                });
            }

            // --- STEP 3: Insert Members Array into 'members' table ---
            const { error: membersError } = await window.supabaseClient
                .from('members')
                .insert(membersPayload);

            // --- STEP 4: Handle Strict Rollback on Failure ---
            if (membersError) {
                // If appending members failed (like a duplicate roll number constraint),
                // we must DELETE the orphaned team we just created in Step 1.
                await window.supabaseClient.from('teams').delete().eq('team_id', newTeamId);

                if (membersError.code === '23505') {
                    throw new Error('One or more of those Roll Numbers is already registered on another team!');
                }
                throw membersError;
            }

            // --- STEP 5: Insert into Registration Spreadsheet Table (Exactly as requested) ---
            try {
                // Get team count for numbering
                const { count } = await window.supabaseClient
                    .from('teams')
                    .select('*', { count: 'exact', head: true });

                const teamNum = count || 0;
                const spreadsheetPayload = [];

                // 1. Leader Row
                spreadsheetPayload.push({
                    team_id: newTeamId,
                    "Team / Number": `Team ${teamNum}: ${teamName}`,
                    "Role": 'Team Leader',
                    "Name": teamLeaderName,
                    "Roll No": rollNumber,
                    "Year": leaderYear,
                    "Section": section,
                    "Email": leaderEmail
                });

                // 2. Member Rows (Blank Team Name)
                membersPayload.slice(1).forEach(m => {
                    spreadsheetPayload.push({
                        team_id: newTeamId,
                        "Team / Number": '',
                        "Role": 'Member',
                        "Name": m.name,
                        "Roll No": m.roll_number,
                        "Year": m.year,
                        "Section": m.section,
                        "Email": m.email
                    });
                });

                // 3. Spacer Row (Completely Empty)
                spreadsheetPayload.push({
                    team_id: newTeamId,
                    "Team / Number": '',
                    "Role": '',
                    "Name": '',
                    "Roll No": '',
                    "Year": '',
                    "Section": '',
                    "Email": ''
                });

                await window.supabaseClient
                    .from('registration_spreadsheet')
                    .insert(spreadsheetPayload);

                // --- STEP 6: Insert into Ordered Registrations Table (Forced Column Order) ---
                const orderedPayload = {
                    team_id: newTeamId,
                    "00_Team_Name": teamName,
                    "01_Leader_Name": teamLeaderName,
                    "02_Leader_Roll_No": rollNumber,
                    "03_Leader_Email": leaderEmail,
                    "04_Leader_Year": leaderYear,
                    "05_Leader_Section": section,

                    "06_Member_1_Name": memberName1,
                    "07_Member_1_Roll_No": member1,
                    "08_Member_1_Email": member1Email,
                    "09_Member_1_Year": member1Year,
                    "10_Member_1_Section": member1Section,

                    "11_Member_2_Name": memberName2,
                    "12_Member_2_Roll_No": member2,
                    "13_Member_2_Email": member2Email,
                    "14_Member_2_Year": member2Year,
                    "15_Member_2_Section": member2Section,

                    "16_Member_3_Name": memberName3 || '',
                    "17_Member_3_Roll_No": member3 || '',
                    "18_Member_3_Email": member3Email || '',
                    "19_Member_3_Year": member3Year || '',
                    "20_Member_3_Section": member3Section || '',

                    "21_Member_4_Name": memberName4 || '',
                    "22_Member_4_Roll_No": member4 || '',
                    "23_Member_4_Email": member4Email || '',
                    "24_Member_4_Year": member4Year || '',
                    "25_Member_4_Section": member4Section || ''
                };

                await window.supabaseClient
                    .from('ordered_registrations')
                    .insert([orderedPayload]);

            } catch (err) {
                console.error("Warning: Failed to create spreadsheet rows", err);
            }

            showFormMsg('🎉 Registration successful! Your team is registered for Creathon 2026.', 'success');
            showToast('Registration successful! 🎉');
            form.reset();
        } catch (err) {
            console.error(err);
            showFormMsg(err.message === 'Supabase not configured'
                ? '⚠️ Supabase not configured. Update supabase-config.js with your credentials.'
                : err.message || 'Something went wrong. Please try again.', 'error');
        }
        resetBtn(submitBtn);
    });

    function showFormMsg(text, type) {
        msgDiv.textContent = text;
        msgDiv.className = `form-message ${type}`;
        msgDiv.style.display = 'block';
    }
    function resetBtn(btn) {
        btn.disabled = false;
        btn.querySelector('span').textContent = 'Submit Registration';
    }
})();
