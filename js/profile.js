document.addEventListener('DOMContentLoaded', function(){
    const SESSION_KEY = 'cem_user';
    const username = sessionStorage.getItem(SESSION_KEY);
    if (!username){ alert('Not logged in'); window.location.href='dashboard.html'; return; }
    const user = App.getUserByUsername(username) || {};
    document.getElementById('firstName').value = user.firstName || '';
    document.getElementById('lastName').value = user.lastName || '';
    document.getElementById('gender').value = user.gender || '';
    document.getElementById('contact').value = user.contact || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('profileUsername').value = user.username || username;
    document.getElementById('description').value = user.description || '';

    document.getElementById('saveProfile').addEventListener('click', function(){
        const first = document.getElementById('firstName').value.trim();
        const last = document.getElementById('lastName').value.trim();
        const gender = document.getElementById('gender').value;
        const contact = document.getElementById('contact').value.trim();
        const email = document.getElementById('email').value.trim();
        const newUser = document.getElementById('profileUsername').value.trim();
        const newPass = document.getElementById('profilePassword').value || '';
        const desc = document.getElementById('description').value.trim();
        if (!first || !last || !email){ alert('Please fill first name, last name and email'); return; }
        const updates = { firstName: first, lastName: last, gender, contact, email, description: desc };
        if (newPass) updates.password = newPass;
        if (newUser) updates.username = newUser;
        const ok = App.updateUser(username, updates);
        if (!ok){ alert('Failed to update profile'); return; }
        // if username changed, update session key
        if (newUser && newUser !== username){
            sessionStorage.setItem(SESSION_KEY, newUser);
        }
        alert('Profile saved');
        window.location.href = 'dashboard.html';
    });
});
