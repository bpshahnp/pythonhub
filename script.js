const snippets = [
    {
        id: 1,
        title: "Hello World",
        category: "basics",
        description: "The classic starting point for any language.",
        code: `print("Hello, World!")`
    },
    {
        id: 2,
        title: "List Comprehension",
        category: "data-structures",
        description: "Create a new list by applying an expression to each item in an iterable.",
        code: `squares = [x**2 for x in range(10)]
print(squares)`
    },
    {
        id: 3,
        title: "Dictionary Iteration",
        category: "data-structures",
        description: "Iterate through keys and values of a dictionary safely.",
        code: `user = {"name": "Alice", "age": 30}
for key, value in user.items():
    print(f"{key}: {value}")`
    },
    {
        id: 4,
        title: "Binary Search",
        category: "algorithms",
        description: "Efficiently find an element in a sorted list (O(log n) time complexity).",
        code: `def binary_search(arr, target):
    low, high = 0, len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1

my_list = [1, 3, 5, 7, 9]
print("Index of 5 is:", binary_search(my_list, 5))`
    }
];

const snippetContainer = document.getElementById('snippet-container');
const categoryButtons = document.querySelectorAll('.category-btn');
const currentCategoryTitle = document.getElementById('current-category');
const loaderBanner = document.getElementById('pyodide-loader');
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

let pyodideInstance = null;
let activeOutputElement = null;

async function initPyodide() {
    try {
        pyodideInstance = await loadPyodide({
            stdout: (text) => {
                if (activeOutputElement) {
                    activeOutputElement.textContent += text; 
                }
            },
            stderr: (text) => {
                if (activeOutputElement) {
                    activeOutputElement.textContent += text; 
                }
            }
        });
        
        loaderBanner.textContent = "Python Environment Ready";
        loaderBanner.classList.add('ready');
        
        document.querySelectorAll('.run-btn').forEach(btn => btn.disabled = false);
        
        setTimeout(() => {
            loaderBanner.style.display = 'none';
        }, 3000);

    } catch (err) {
        loaderBanner.textContent = "Failed to load Python environment. Check your connection.";
        loaderBanner.style.backgroundColor = "#ff5555";
        console.error("Pyodide init failed:", err);
    }
}

initPyodide();

function renderSnippets(filterCategory = 'all') {
    snippetContainer.innerHTML = ''; 

    const filteredSnippets = filterCategory === 'all' 
        ? snippets 
        : snippets.filter(s => s.category === filterCategory);

    if (filteredSnippets.length === 0) {
        snippetContainer.innerHTML = '<p>No snippets found for this category.</p>';
        return;
    }

    filteredSnippets.forEach(snippet => {
        const card = document.createElement('div');
        card.className = 'snippet-card';
        
        const isReady = pyodideInstance !== null;
        
        card.innerHTML = `
            <span class="badge">${formatCategoryName(snippet.category)}</span>
            <div class="snippet-header">
                <h3>${snippet.title}</h3>
                <div class="action-buttons">
                    <button class="run-btn" ${isReady ? '' : 'disabled'}>Run Code</button>
                    <button class="copy-btn">Copy Code</button>
                </div>
            </div>
            <p style="margin-bottom: 1rem;">${snippet.description}</p>
            <pre><code class="language-python">${escapeHTML(snippet.code)}</code></pre>
            <div class="output-container" id="output-${snippet.id}"></div>
        `;

        const runBtn = card.querySelector('.run-btn');
        runBtn.addEventListener('click', () => runPythonCode(snippet.code, `output-${snippet.id}`, runBtn));

        const copyBtn = card.querySelector('.copy-btn');
        copyBtn.addEventListener('click', function() {
            copyToClipboard(this, snippet.code);
        });

        snippetContainer.appendChild(card);
    });

    if (window.Prism) {
        Prism.highlightAll();
    }
}

async function runPythonCode(code, outputId, btnElement) {
    if (!pyodideInstance) return;

    activeOutputElement = document.getElementById(outputId);
    activeOutputElement.style.display = "block";
    activeOutputElement.textContent = ""; 
    activeOutputElement.style.color = "#4CAF50"; 
    
    btnElement.disabled = true;
    btnElement.textContent = "Running...";

    try {
        await pyodideInstance.runPythonAsync(code);
        
        if (activeOutputElement.textContent.trim() === "") {
             activeOutputElement.textContent = "[Program executed successfully with no output]";
        }
    } catch (err) {
        activeOutputElement.style.color = "#ff5555";
        activeOutputElement.textContent += err.toString();
    } finally {
        btnElement.disabled = false;
        btnElement.textContent = "Run Code";
        activeOutputElement = null;
    }
}

categoryButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        const category = e.target.getAttribute('data-category');
        currentCategoryTitle.textContent = e.target.textContent;
        renderSnippets(category);

        if (window.innerWidth <= 768) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }
    });
});

menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
});

overlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
});

function copyToClipboard(button, code) {
    navigator.clipboard.writeText(code).then(() => {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag] || tag));
}

function formatCategoryName(slug) {
    return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

renderSnippets();