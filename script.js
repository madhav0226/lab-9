// Script to read and parse XML employee data and display in tabular format

// State to store loaded employee data for client-side search/filtering
let employeesData = [];

// DOM Element references
const btnFetchXml = document.getElementById('btnFetchXml');
const xmlFileInput = document.getElementById('xmlFileInput');
const btnClear = document.getElementById('btnClear');
const searchInput = document.getElementById('searchInput');
const statusBar = document.getElementById('statusBar');
const statsBar = document.getElementById('statsBar');
const statTotal = document.getElementById('statTotal');
const statFiltered = document.getElementById('statFiltered');
const statDepts = document.getElementById('statDepts');
const employeeTable = document.getElementById('employeeTable');
const employeeTableBody = document.getElementById('employeeTableBody');
const emptyState = document.getElementById('emptyState');

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    btnFetchXml.addEventListener('click', loadXMLViaFetch);
    xmlFileInput.addEventListener('change', handleFileUpload);
    btnClear.addEventListener('click', resetTable);
    searchInput.addEventListener('input', handleSearch);

    // Attempt to auto-fetch when served over HTTP/HTTPS
    if (window.location.protocol.startsWith('http')) {
        loadXMLViaFetch();
    }
});

/**
 * Display alert/status messages to the user
 */
function showStatus(message, type = 'info') {
    statusBar.textContent = message;
    statusBar.className = `status-bar active ${type}`;

    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            if (statusBar.classList.contains('active')) {
                statusBar.classList.remove('active');
            }
        }, 5000);
    }
}

/**
 * Fetches the XML file using Fetch API and parses it
 */
async function loadXMLViaFetch() {
    showStatus('Fetching employees.xml...', 'info');

    try {
        const response = await fetch('employees.xml');

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} (${response.statusText})`);
        }

        const xmlText = await response.text();
        parseAndProcessXML(xmlText, 'employees.xml');
    } catch (error) {
        console.error('Fetch error:', error);

        // Check if opened via file:// protocol
        if (window.location.protocol === 'file:') {
            showStatus(
                'Browsers block fetch() on local file:// URLs due to CORS. Please use the "Choose XML File" button to pick employees.xml, or run via a local web server.',
                'error'
            );
        } else {
            showStatus(`Failed to load XML: ${error.message}`, 'error');
        }
    }
}

/**
 * Handles XML file selection from disk via <input type="file">
 */
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    showStatus(`Reading local file "${file.name}"...`, 'info');

    const reader = new FileReader();

    reader.onload = (e) => {
        const xmlText = e.target.result;
        parseAndProcessXML(xmlText, file.name);
    };

    reader.onerror = () => {
        showStatus(`Error reading file: ${reader.error}`, 'error');
    };

    reader.readAsText(file);
}

/**
 * Parses XML text using DOMParser and extracts employee nodes
 */
function parseAndProcessXML(xmlText, sourceName) {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

        // Check for XML parsing errors
        const parseError = xmlDoc.getElementsByTagName('parsererror');
        if (parseError.length > 0) {
            throw new Error(parseError[0].textContent || 'Invalid XML syntax');
        }

        // Query all <employee> elements
        const employeeNodes = xmlDoc.getElementsByTagName('employee');

        if (employeeNodes.length === 0) {
            showStatus(`XML loaded from "${sourceName}", but no <employee> elements were found.`, 'error');
            resetTable();
            return;
        }

        // Extract employee data into an array of objects
        employeesData = [];
        for (let i = 0; i < employeeNodes.length; i++) {
            const emp = employeeNodes[i];

            const id = emp.getAttribute('id') || `EMP-${i + 1}`;
            const name = getElementValue(emp, 'name');
            const department = getElementValue(emp, 'department');
            const designation = getElementValue(emp, 'designation');
            const email = getElementValue(emp, 'email');
            const phone = getElementValue(emp, 'phone');
            const salary = getElementValue(emp, 'salary');
            const joiningDate = getElementValue(emp, 'joiningDate');

            employeesData.push({
                id,
                name,
                department,
                designation,
                email,
                phone,
                salary,
                joiningDate
            });
        }

        // Render table
        renderTable(employeesData);
        updateStatistics(employeesData, employeesData.length);

        // UI state updates
        searchInput.disabled = false;
        searchInput.value = '';
        btnClear.style.display = 'inline-flex';
        showStatus(`Successfully loaded ${employeesData.length} employee records from "${sourceName}".`, 'success');

    } catch (err) {
        console.error('XML Parse Error:', err);
        showStatus(`Failed to parse XML: ${err.message}`, 'error');
    }
}

/**
 * Helper to safely extract text content of an XML child element
 */
function getElementValue(parent, tagName) {
    const el = parent.getElementsByTagName(tagName)[0];
    return el && el.textContent ? el.textContent.trim() : 'N/A';
}

/**
 * Renders the employee list into HTML table rows
 */
function renderTable(dataList) {
    employeeTableBody.innerHTML = '';

    if (dataList.length === 0) {
        emptyState.style.display = 'block';
        emptyState.querySelector('h3').textContent = 'No Matching Records';
        emptyState.querySelector('p').textContent = 'No employees match your search query.';
        return;
    }

    emptyState.style.display = 'none';

    dataList.forEach(emp => {
        const row = document.createElement('tr');

        // Format salary into currency
        const formattedSalary = !isNaN(Number(emp.salary)) && emp.salary !== 'N/A'
            ? `$${Number(emp.salary).toLocaleString()}`
            : emp.salary;

        // Department badge class
        const deptClass = 'badge badge-' + emp.department.toLowerCase().replace(/\s+/g, '-');

        row.innerHTML = `
            <td><strong>${escapeHtml(emp.id)}</strong></td>
            <td>${escapeHtml(emp.name)}</td>
            <td><span class="${deptClass}">${escapeHtml(emp.department)}</span></td>
            <td>${escapeHtml(emp.designation)}</td>
            <td><a href="mailto:${encodeURIComponent(emp.email)}" style="color: #2563eb; text-decoration: none;">${escapeHtml(emp.email)}</a></td>
            <td>${escapeHtml(emp.phone)}</td>
            <td>${escapeHtml(formattedSalary)}</td>
            <td>${escapeHtml(emp.joiningDate)}</td>
        `;

        employeeTableBody.appendChild(row);
    });
}

/**
 * Update summary stats counter
 */
function updateStatistics(fullList, filteredCount) {
    if (fullList.length === 0) {
        statsBar.style.display = 'none';
        return;
    }

    const uniqueDepts = new Set(fullList.map(e => e.department).filter(d => d !== 'N/A'));

    statTotal.textContent = fullList.length;
    statFiltered.textContent = filteredCount;
    statDepts.textContent = uniqueDepts.size;
    statsBar.style.display = 'flex';
}

/**
 * Handles search filter in real-time
 */
function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();

    if (!query) {
        renderTable(employeesData);
        updateStatistics(employeesData, employeesData.length);
        return;
    }

    const filtered = employeesData.filter(emp =>
        emp.id.toLowerCase().includes(query) ||
        emp.name.toLowerCase().includes(query) ||
        emp.department.toLowerCase().includes(query) ||
        emp.designation.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query)
    );

    renderTable(filtered);
    updateStatistics(employeesData, filtered.length);
}

/**
 * Resets table and UI state
 */
function resetTable() {
    employeesData = [];
    employeeTableBody.innerHTML = '';
    emptyState.style.display = 'block';
    emptyState.querySelector('h3').textContent = 'No Data Loaded';
    emptyState.querySelector('p').textContent = 'Click "Load employees.xml" or select a local XML file to display employee records.';
    statsBar.style.display = 'none';
    searchInput.value = '';
    searchInput.disabled = true;
    btnClear.style.display = 'none';
    xmlFileInput.value = '';
    showStatus('Table cleared.', 'info');
}

/**
 * Utility to escape HTML to prevent XSS injection
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
