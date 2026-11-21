# Crumb & Co. — Bakery Management System

Crumb & Co. is a bakery management system developed as part of the IMS566 individual project. The system is designed to help manage daily bakery operations, including products, orders and customer records. It also provides a separate page for customers to browse products and place orders.

## Features

- **Login system:** Separate access for Admin/Staff and Customers, with basic login validation.
- **Admin/Staff dashboard:** Displays sales, orders, products, pending orders, recent orders and low-stock items.
- **Customer registration:** New customers can create their own accounts and their details will appear in the Customers page.
- **Customer profile:** Customers can update their name, email, phone number and password.
- **Role-based access:** Admin/Staff and customers are directed to different pages based on their account roles.
- **Product management:** Admin/Staff can add, edit, delete, search and filter products.
- **Order management:** Admin/Staff can create orders, update order status and search for existing orders.
- **Customer management:** Admin/Staff can add, delete and search customer records.
- **Customer shop:** Customers can browse products, place orders, check their order history and cancel pending orders.
- **Dashboard charts:** Displays sales and order trends, as well as best-selling products.
- **Responsive design:** The website uses Bootstrap navigation that adjusts to different screen sizes.
- **Data storage:** Uses browser `localStorage` to keep records when the page is reopened.

## Demo Login

| Role | Username | Password |
|---|---|---|
| Admin / Staff | `admin` | `admin1122` |
| Customer | `aisha` | `aisha000` |

New customers can also register through `register.html` or by selecting **Create an account** on the login page.


## How to Run the System

1. Download the project files or clone the repository.
2. Open the project folder using Visual Studio Code.
3. Open `login.html` in Google Chrome, or run the project using the Live Server extension.
4. Log in using one of the demo accounts above.
5. For Admin/Staff, explore the Dashboard, Products, Orders and Customers pages.
6. For Customers, open the shop page to browse products and place orders.

## Data Storage

The system uses the browser's `localStorage` to save product, order, customer and login session data.

This means the data stays in the same browser and device used during testing. The project does not currently use an online database or server-side storage.

To reset the sample data, open Chrome Developer Tools and go to **Application → Local Storage**. Select the website origin and remove the keys beginning with `crumb_`. This will also remove newly registered customer accounts. Reload the page to load the sample data again.

## Technologies Used

- HTML5
- CSS3
- JavaScript
- Bootstrap 5.3.3
- Bootstrap Icons
- Chart.js 4.4.3

## Project Structure

bakery-management-system/
├── index.html
├── login.html
├── register.html
├── shop.html
├── products.html
├── orders.html
├── customers.html
├── favicon.svg
├── README.md
├── css/
│   └── style.css
└── js/
    ├── app.js
    ├── auth.js
    ├── register.js
    ├── shop.js
    ├── dashboard.js
    ├── products.js
    ├── orders.js
    └── customers.js


## GitHub Repository

The project files are uploaded to GitHub for submission and version control.

To access the project:

1. Open the GitHub repository.
2. Download or clone the repository to your computer.
3. Open the project folder using Visual Studio Code.
4. Run `login.html` using Google Chrome or the Live Server extension.


## Additional Notes

The project includes sample products and orders for testing the system. Any changes made while using the website, such as adding products or placing orders, are saved in the browser's local storage.