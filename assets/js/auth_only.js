    if (localStorage.getItem('isLoggedIn') !== 'true') {
        // Si non, on renvoie direct vers la page de login
        window.location.replace("error.html");
    }