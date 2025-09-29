// Report page specific script
document.addEventListener('DOMContentLoaded', function() {
    // Generate report
    generateReport();
});

function generateReport() {
    // Simulate game data (in real application would be retrieved from localStorage or server)
    const gameData = {
        forest: { completed: true, score: 4, data: {} },
        library: { completed: true, score: 3, data: {} },
        river: { completed: true, score: 5, data: {} },
        tower: { completed: true, score: 4, data: {} }
    };
    
    // Generate report HTML
    const reportGenerator = new ReportGenerator(gameData);
    const reportHTML = reportGenerator.generateHTML();
    
    // Display report
    document.getElementById('report-content').innerHTML = reportHTML;
}

function printReport() {
    window.print();
}

function downloadReport() {
    // Create report text
    const reportText = generateTextReport();
    
    // Create download link
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Little Explorer Assessment Report.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function generateTextReport() {
    return `
Little Explorer - ADHD Assessment Report
========================================

Report Generation Time: ${new Date().toLocaleString()}

Overall Assessment:
- Completed Levels: 4/4
- Total Stars: 16
- Average Performance: 4.0/5

Performance by Level:
1. Magic Forest (Attention Test): 4 Stars
2. Ancient Library (Organization Test): 3 Stars  
3. Patience River (Impulse Control Test): 5 Stars
4. Wisdom Tower (Executive Function Test): 4 Stars

Professional Advice:
- Attention Training: Recommended to practice focus exercises
- Organization Training: Recommended to learn task planning skills
- Impulse Control Training: Excellent performance, keep it up
- Executive Function Training: Recommended to practice memory training

Note: This assessment is for reference only. For professional diagnosis, please consult relevant medical professionals.
    `;
}
