const courses = [];
const students = [];

function updateCourseDropdowns() {
    const courseDropdowns = [
        document.getElementById('student-course'),
        document.getElementById('course-filter'),
        document.getElementById('course-stats-name')
    ];
    courseDropdowns.forEach(dropdown => {
        dropdown.innerHTML = '<option value="all">Tüm dersler</option>';
        courses.forEach(course => {
            const option = new Option(course.name, course.name);
            dropdown.add(option);
        });
    });
}

document.getElementById('add-course-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const courseName = document.getElementById('course-name').value.trim();
    const gradingScale = document.getElementById('grading-scale').value;

    if (!courseName) {
        alert("Ders adı boş bırakılamaz!");
        return;
    }

    if (courses.some(course => course.name === courseName)) {
        alert("Bu ders zaten eklenmiş!");
        return;
    }

    courses.push({ name: courseName, gradingScale });
    updateCourseDropdowns();
    alert(`${courseName} başarıyla eklendi!`);
    this.reset();
});

function calculateGrade(score, scale) {
    if (scale === '10-point') {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    } else if (scale === '7-point') {
        if (score >= 93) return 'A';
        if (score >= 85) return 'B';
        if (score >= 77) return 'C';
        if (score >= 70) return 'D';
        return 'F';
    }
}

document.getElementById('add-student-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const studentId = document.getElementById('student-id').value.trim();
    const studentName = document.getElementById('student-name').value.trim();
    const studentSurname = document.getElementById('student-surname').value.trim();
    const midtermScore = parseFloat(document.getElementById('midterm-score').value);
    const finalScore = parseFloat(document.getElementById('final-score').value);
    const selectedCourse = document.getElementById('student-course').value;

    if (!studentId || isNaN(studentId)) {
        alert("Öğrenci numarası sadece sayı olmalıdır!");
        return;
    }

    if (midtermScore < 0 || midtermScore > 100 || isNaN(midtermScore)) {
        alert("Vize notu 0-100 arasında olmalıdır!");
        return;
    }

    if (finalScore < 0 || finalScore > 100 || isNaN(finalScore)) {
        alert("Final notu 0-100 arasında olmalıdır!");
        return;
    }

    if (selectedCourse === 'none') {
        alert("Lütfen bir ders seçin!");
        return;
    }

    const course = courses.find(course => course.name === selectedCourse);
    const totalScore = (midtermScore * 0.4) + (finalScore * 0.6);
    const grade = calculateGrade(totalScore, course.gradingScale);

    const newStudent = {
        id: studentId,
        name: studentName,
        surname: studentSurname,
        midterm: midtermScore,
        final: finalScore,
        total: totalScore,
        grade,
        course: selectedCourse
    };

    students.push(newStudent);
    course.students = [...(course.students || []), newStudent];
    alert(`${studentName} ${studentSurname} başarıyla eklendi!`);
    updateTable(selectedCourse);
    this.reset();
});

function updateTable(courseName = 'all') {
    const tableBody = document.querySelector('#results-table tbody');
    tableBody.innerHTML = '';

    const filteredStudents = courseName === 'all' ? students : students.filter(student => student.course === courseName);

    filteredStudents.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.id}</td>
            <td>${student.name} ${student.surname}</td>
            <td>${student.course}</td>
            <td>${student.midterm}</td>
            <td>${student.final}</td>
            <td>${student.grade}</td>
            <td>
                <button onclick="editStudent('${student.id}')">Güncelle</button>
                <button onclick="deleteStudent('${student.id}', '${student.course}')">Sil</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    if (filteredStudents.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `<td colspan="7" style="text-align: center;">Kriterlere uygun öğrenci bulunamadı.</td>`;
        tableBody.appendChild(emptyRow);
    }
}

function deleteStudent(studentId, courseName) {
    const index = students.findIndex(student => student.id === studentId);
    if (index !== -1) {
        students.splice(index, 1);
        alert('Öğrenci başarıyla silindi!');
        updateTable(courseName);
    }
}

function editStudent(studentId) {
    const student = students.find(student => student.id === studentId);
    if (!student) {
        alert("Öğrenci bulunamadı!");
        return;
    }

    document.getElementById('student-id').value = student.id;
    document.getElementById('student-name').value = student.name;
    document.getElementById('student-surname').value = student.surname;
    document.getElementById('midterm-score').value = student.midterm;
    document.getElementById('final-score').value = student.final;
    document.getElementById('student-course').value = student.course;

    const submitButton = document.querySelector('#add-student-form button[type="submit"]');
    submitButton.textContent = "Not Güncelle";
    submitButton.onclick = function (e) {
        e.preventDefault();

        student.midterm = parseFloat(document.getElementById('midterm-score').value);
        student.final = parseFloat(document.getElementById('final-score').value);
        student.total = (student.midterm * 0.4) + (student.final * 0.6);
        student.grade = calculateGrade(student.total, courses.find(course => course.name === student.course).gradingScale);

        alert("Öğrenci notları güncellendi!");
        updateTable(document.getElementById('course-filter').value);
        this.textContent = "Öğrenci Ekle";
        this.onclick = null;
    };
}

document.getElementById('course-filter').addEventListener('change', function () {
    updateTable(this.value);
});

document.getElementById('course-stats-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const selectedCourse = document.getElementById('course-stats-name').value;

    let courseStudents = [];
    if (selectedCourse === 'all') {
        courseStudents = students;
    } else {
        courseStudents = students.filter(student => student.course === selectedCourse);
    }

    const passed = courseStudents.filter(student => student.grade !== 'F').length;
    const failed = courseStudents.length - passed;
    const mean = courseStudents.length > 0
        ? (courseStudents.reduce((sum, student) => sum + student.total, 0) / courseStudents.length).toFixed(2)
        : 0;

    document.getElementById('course-stats-result').innerHTML = `
        <p>Toplam Öğrenci: ${courseStudents.length}</p>
        <p>Geçen Öğrenci: ${passed}</p>
        <p>Kalan Öğrenci: ${failed}</p>
        <p>Sınıf Ortalaması: ${mean}</p>
    `;
});

document.getElementById('search-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const query = document.getElementById('search-input').value.toLowerCase();
    const searchResultsTable = document.querySelector('#search-results-table tbody');
    searchResultsTable.innerHTML = '';

    const foundStudents = students.filter(student =>
        student.name.toLowerCase().includes(query) ||
        student.surname.toLowerCase().includes(query) ||
        student.id.includes(query)
    );

    foundStudents.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.id}</td>
            <td>${student.name} ${student.surname}</td>
            <td>${student.course}</td>
            <td>${student.grade}</td>
            <td>${(student.total).toFixed(2)}</td>
        `;
        searchResultsTable.appendChild(row);
    });

    if (foundStudents.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `<td colspan="5" style="text-align: center;">Arama kriterlerine uygun öğrenci bulunamadı.</td>`;
        searchResultsTable.appendChild(emptyRow);
    }
});

document.getElementById('view-all-students').addEventListener('click', () => updateQuickActionsTable('all'));
document.getElementById('view-passed-students').addEventListener('click', () => updateQuickActionsTable('passed'));
document.getElementById('view-failed-students').addEventListener('click', () => updateQuickActionsTable('failed'));

function updateQuickActionsTable(filter) {
    const tableBody = document.querySelector('#quick-actions-table tbody');
    tableBody.innerHTML = '';

    let filteredStudents = [];
    if (filter === 'all') {
        filteredStudents = students;
    } else if (filter === 'passed') {
        filteredStudents = students.filter(student => student.grade !== 'F');
    } else if (filter === 'failed') {
        filteredStudents = students.filter(student => student.grade === 'F');
    }

    filteredStudents.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.id}</td>
            <td>${student.name} ${student.surname}</td>
            <td>${student.grade}</td>
            <td>${student.course}</td>
        `;
        tableBody.appendChild(row);
    });

    if (filteredStudents.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `<td colspan="4" style="text-align: center;">Kriterlere uygun öğrenci bulunamadı.</td>`;
        tableBody.appendChild(emptyRow);
    }
}
