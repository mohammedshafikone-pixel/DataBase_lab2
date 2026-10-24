const authorsList = document.getElementById('authorsList');
const booksList = document.getElementById('booksList');
const bookAuthor = document.getElementById('bookAuthor');
const message = document.getElementById('message');

function showMessage(text, isError = false) {
    message.textContent = text;
    message.style.color = isError ? 'red' : 'green';
}

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
        throw new Error(data.error || data.message || 'Request failed');
    }

    return data;
}

async function loadAuthors() {
    const authors = await api('/api/authors');

    authorsList.replaceChildren();
    bookAuthor.replaceChildren();

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select author';
    bookAuthor.appendChild(defaultOption);

    authors.forEach(author => {
        const item = document.createElement('div');
        item.className = 'item';

        const details = document.createElement('span');
        details.textContent =
            `${author.name} — ${author.country} `;

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.textContent = 'Delete';

        deleteButton.addEventListener('click', async () => {
            const confirmed = confirm(
                `Delete ${author.name} and all their books?`
            );

            if (!confirmed) return;

            try {
                await api(`/api/authors/${author.author_id}`, {
                    method: 'DELETE'
                });

                showMessage('Author deleted successfully.');
                await refreshData();
            } catch (error) {
                showMessage(error.message, true);
            }
        });

        item.append(details, deleteButton);
        authorsList.appendChild(item);

        const option = document.createElement('option');
        option.value = author.author_id;
        option.textContent = author.name;
        bookAuthor.appendChild(option);
    });

    if (authors.length === 0) {
        authorsList.textContent = 'No authors found.';
    }
}

async function loadBooks() {
    const books = await api('/api/books');

    booksList.replaceChildren();

    books.forEach(book => {
        const item = document.createElement('div');
        item.className = 'item';

        const details = document.createElement('span');
        details.textContent =
            `${book.title} | ${book.price} | Author: ${book.author_name} `;

        const editButton = document.createElement('button');
        editButton.className = 'edit-button';
        editButton.textContent = 'Edit';

        editButton.addEventListener('click', async () => {
            const title = prompt('Enter the new book title:', book.title);
            if (title === null) return;

            if (!title.trim()) {
                showMessage('Title cannot be empty.', true);
                return;
            }

            const priceText = prompt('Enter the new price:', book.price);
            if (priceText === null) return;

            const price = Number(priceText);

            if (priceText.trim() === '' || !Number.isFinite(price) || price < 0) {
                showMessage('Enter a valid non-negative price.', true);
                return;
            }

            const authorText = prompt(
                `Enter the author ID (current: ${book.author_id}):`
            );

            if (authorText === null) return;

            const authorId = Number(authorText);

            if (!Number.isInteger(authorId) || authorId < 1) {
                showMessage('Enter a valid author ID.', true);
                return;
            }

            try {
                await api(`/api/books/${book.book_id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        title: title.trim(),
                        price,
                        author_id: authorId
                    })
                });

                showMessage('Book updated successfully.');
                await refreshData();
            } catch (error) {
                showMessage(error.message, true);
            }
        });

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.textContent = 'Delete';

        deleteButton.addEventListener('click', async () => {
            if (!confirm(`Delete "${book.title}"?`)) return;

            try {
                await api(`/api/books/${book.book_id}`, {
                    method: 'DELETE'
                });

                showMessage('Book deleted successfully.');
                await refreshData();
            } catch (error) {
                showMessage(error.message, true);
            }
        });

        item.append(details, editButton, deleteButton);
        booksList.appendChild(item);
    });

    if (books.length === 0) {
        booksList.textContent = 'No books found.';
    }
}

async function refreshData() {
    await loadAuthors();
    await loadBooks();
}

document.getElementById('authorForm').addEventListener('submit', async event => {
    event.preventDefault();

    const name = document.getElementById('authorName').value.trim();
    const country = document.getElementById('authorCountry').value.trim();

    try {
        await api('/api/authors', {
            method: 'POST',
            body: JSON.stringify({ name, country })
        });

        event.target.reset();
        showMessage('Author added successfully.');
        await refreshData();
    } catch (error) {
        showMessage(error.message, true);
    }
});

document.getElementById('bookForm').addEventListener('submit', async event => {
    event.preventDefault();

    const title = document.getElementById('bookTitle').value.trim();
    const price = Number(document.getElementById('bookPrice').value);
    const author_id = Number(bookAuthor.value);

    if (!title || !Number.isFinite(price) || price < 0 || !author_id) {
        showMessage('Enter valid book information.', true);
        return;
    }

    try {
        await api('/api/books', {
            method: 'POST',
            body: JSON.stringify({ title, price, author_id })
        });

        event.target.reset();
        showMessage('Book added successfully.');
        await refreshData();
    } catch (error) {
        showMessage(error.message, true);
    }
});

refreshData().catch(error => {
    showMessage(`Could not load data: ${error.message}`, true);
    authorsList.textContent = 'Could not load authors.';
    booksList.textContent = 'Could not load books.';
});
