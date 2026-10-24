const authorsList = document.getElementById('authorsList');
const booksList = document.getElementById('booksList');
const bookAuthor = document.getElementById('bookAuthor');
const message = document.getElementById('message');

// Display messages
function showMessage(text, isError = false) {
    message.textContent = text;
    message.style.color = isError ? 'red' : 'green';
}

// API request helper
async function api(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error || data.message || 'Request failed'
        );
    }

    return data;
}

// Create a button
function createButton(text, className, onClick) {
    const button = document.createElement('button');

    button.textContent = text;
    button.className = className;
    button.addEventListener('click', onClick);

    return button;
}

// =====================================
// LOAD AND DISPLAY AUTHORS
// =====================================

async function loadAuthors() {
    const authors = await api('/api/authors');

    authorsList.replaceChildren();
    bookAuthor.replaceChildren();

    // Default option in book author dropdown
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select author';

    bookAuthor.appendChild(defaultOption);

    authors.forEach(author => {
        const item = document.createElement('div');
        item.className = 'item';

        // Author information
        const details = document.createElement('span');

        details.textContent =
            `Author ID: ${author.author_id} | ` +
            `Name: ${author.name} | ` +
            `Country: ${author.country}`;

        // EDIT AUTHOR BUTTON
        const editButton = createButton(
            'Edit',
            'edit-button',
            async () => {
                const name = prompt(
                    'Enter the new author name:',
                    author.name
                );

                if (name === null) return;

                if (!name.trim()) {
                    showMessage(
                        'Author name cannot be empty.',
                        true
                    );
                    return;
                }

                const country = prompt(
                    'Enter the new country:',
                    author.country
                );

                if (country === null) return;

                if (!country.trim()) {
                    showMessage(
                        'Country cannot be empty.',
                        true
                    );
                    return;
                }

                try {
                    await api(
                        `/api/authors/${author.author_id}`,
                        {
                            method: 'PUT',
                            body: JSON.stringify({
                                name: name.trim(),
                                country: country.trim()
                            })
                        }
                    );

                    showMessage(
                        'Author updated successfully.'
                    );

                    await refreshData();

                } catch (error) {
                    showMessage(error.message, true);
                }
            }
        );

        // DELETE AUTHOR BUTTON
        const deleteButton = createButton(
            'Delete',
            'delete-button',
            async () => {
                const confirmed = confirm(
                    `Delete ${author.name} and all their books?`
                );

                if (!confirmed) return;

                try {
                    await api(
                        `/api/authors/${author.author_id}`,
                        {
                            method: 'DELETE'
                        }
                    );

                    showMessage(
                        'Author deleted successfully.'
                    );

                    await refreshData();

                } catch (error) {
                    showMessage(error.message, true);
                }
            }
        );

        // Display BOTH buttons beside the author
        item.append(details, editButton, deleteButton);
        authorsList.appendChild(item);

        // Add author to book dropdown
        const option = document.createElement('option');

        option.value = author.author_id;
        option.textContent =
            `${author.name} (ID: ${author.author_id})`;

        bookAuthor.appendChild(option);
    });

    if (authors.length === 0) {
        authorsList.textContent = 'No authors found.';
    }
}

// =====================================
// LOAD AND DISPLAY BOOKS
// =====================================

async function loadBooks() {
    const books = await api('/api/books');

    booksList.replaceChildren();

    books.forEach(book => {
        const item = document.createElement('div');
        item.className = 'item';

        // Book information
        const details = document.createElement('span');

        details.textContent =
            `Book ID: ${book.book_id} | ` +
            `Title: ${book.title} | ` +
            `Price: ${book.price} | ` +
            `Author ID: ${book.author_id} | ` +
            `Author: ${book.author_name}`;

        // EDIT BOOK BUTTON
        const editButton = createButton(
            'Edit',
            'edit-button',
            async () => {
                const title = prompt(
                    'Enter the new book title:',
                    book.title
                );

                if (title === null) return;

                if (!title.trim()) {
                    showMessage(
                        'Book title cannot be empty.',
                        true
                    );
                    return;
                }

                const priceText = prompt(
                    'Enter the new price:',
                    book.price
                );

                if (priceText === null) return;

                const price = Number(priceText);

                if (
                    priceText.trim() === '' ||
                    !Number.isFinite(price) ||
                    price < 0
                ) {
                    showMessage(
                        'Enter a valid non-negative price.',
                        true
                    );
                    return;
                }

                // Select the author by ID
                const authorText = prompt(
                    `Enter the author ID (current: ${book.author_id}):`
                );

                if (authorText === null) return;

                const authorId = Number(authorText);

                if (
                    !Number.isInteger(authorId) ||
                    authorId < 1
                ) {
                    showMessage(
                        'Enter a valid author ID.',
                        true
                    );
                    return;
                }

                try {
                    await api(
                        `/api/books/${book.book_id}`,
                        {
                            method: 'PUT',
                            body: JSON.stringify({
                                title: title.trim(),
                                price: price,
                                author_id: authorId
                            })
                        }
                    );

                    showMessage(
                        'Book updated successfully.'
                    );

                    await refreshData();

                } catch (error) {
                    showMessage(error.message, true);
                }
            }
        );

        // DELETE BOOK BUTTON
        const deleteButton = createButton(
            'Delete',
            'delete-button',
            async () => {
                const confirmed = confirm(
                    `Delete "${book.title}"?`
                );

                if (!confirmed) return;

                try {
                    await api(
                        `/api/books/${book.book_id}`,
                        {
                            method: 'DELETE'
                        }
                    );

                    showMessage(
                        'Book deleted successfully.'
                    );

                    await refreshData();

                } catch (error) {
                    showMessage(error.message, true);
                }
            }
        );

        // Display BOTH buttons beside the book
        item.append(details, editButton, deleteButton);
        booksList.appendChild(item);
    });

    if (books.length === 0) {
        booksList.textContent = 'No books found.';
    }
}

// =====================================
// REFRESH AUTHORS AND BOOKS
// =====================================

async function refreshData() {
    await loadAuthors();
    await loadBooks();
}

// =====================================
// ADD AUTHOR
// =====================================

document.getElementById('authorForm').addEventListener(
    'submit',
    async event => {
        event.preventDefault();

        const name = document
            .getElementById('authorName')
            .value.trim();

        const country = document
            .getElementById('authorCountry')
            .value.trim();

        if (!name || !country) {
            showMessage(
                'Please enter the author name and country.',
                true
            );
            return;
        }

        try {
            await api('/api/authors', {
                method: 'POST',
                body: JSON.stringify({
                    name: name,
                    country: country
                })
            });

            event.target.reset();

            showMessage('Author added successfully.');

            await refreshData();

        } catch (error) {
            showMessage(error.message, true);
        }
    }
);

// =====================================
// ADD BOOK
// =====================================

document.getElementById('bookForm').addEventListener(
    'submit',
    async event => {
        event.preventDefault();

        const title = document
            .getElementById('bookTitle')
            .value.trim();

        const priceText = document
            .getElementById('bookPrice')
            .value;

        const price = Number(priceText);
        const author_id = Number(bookAuthor.value);

        if (
            !title ||
            priceText.trim() === '' ||
            !Number.isFinite(price) ||
            price < 0 ||
            !Number.isInteger(author_id) ||
            author_id < 1
        ) {
            showMessage(
                'Enter valid book information and select an author.',
                true
            );
            return;
        }

        try {
            await api('/api/books', {
                method: 'POST',
                body: JSON.stringify({
                    title: title,
                    price: price,
                    author_id: author_id
                })
            });

            event.target.reset();

            showMessage('Book added successfully.');

            await refreshData();

        } catch (error) {
            showMessage(error.message, true);
        }
    }
);

// =====================================
// LOAD INITIAL DATA
// =====================================

refreshData().catch(error => {
    showMessage(
        `Could not load data: ${error.message}`,
        true
    );

    authorsList.textContent = 'Could not load authors.';
    booksList.textContent = 'Could not load books.';
});
