function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white text-sm flex items-center gap-2 toast-enter ${
        type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
    }`;
    
    // Add icon based on type
    const icon = type === 'error' ? 
        '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' :
        '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
    
    toast.innerHTML = icon + message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.replace('toast-enter', 'toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, 2700);
}

// editNote function removed

function deleteNote(filename) {
    fetch(`/delete/${filename}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('Note moved to recycle bin');
            window.location.reload();
        } else {
            throw new Error(data.error || 'Failed to move note');
        }
    })
    .catch(error => showToast(error.message, 'error'));
}

function restoreNote(filename) {
    fetch(`/restore/${filename}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('Note restored successfully');
            window.location.reload();
        } else {
            throw new Error(data.error || 'Failed to restore note');
        }
    })
    .catch(error => showToast(error.message, 'error'));
}

function permanentDelete(filename) {
    fetch(`/permanent-delete/${filename}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('Note permanently deleted');
            window.location.reload();
        } else {
            throw new Error(data.error || 'Failed to delete note');
        }
    })
    .catch(error => showToast(error.message, 'error'));
}
