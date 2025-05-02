const expiryTime = new Date();

export const setExpiryBasedOnRole = (role) => {
    switch (role) {
        case "admin":
        expiryTime.setMinutes(expiryTime.getMinutes() + 60);
        break;
        case "department_head":
        expiryTime.setMinutes(expiryTime.getMinutes() + 45);
        break;
        case "employee":
        expiryTime.setMinutes(expiryTime.getMinutes() + 30);
        break;
        case "guest":
        expiryTime.setMinutes(expiryTime.getMinutes() + 15);
        break;
        default:
        expiryTime.setMinutes(expiryTime.getMinutes() + 15);
    }

    return expiryTime;
};


