// Report Generator Class
class ReportGenerator {
    constructor(gameData) {
        this.gameData = gameData;
        this.assessments = {};
        this.calculateAllAssessments();
    }
    
    calculateAllAssessments() {
        // Calculate assessment data for each level
        Object.keys(this.gameData).forEach(level => {
            if (this.gameData[level].completed) {
                const dataCollector = new DataCollector();
                // Simulate data collection (in real application would be retrieved from actual data)
                this.assessments[level] = this.simulateAssessment(level);
            }
        });
    }
    
    simulateAssessment(level) {
        // Simulate assessment data based on level completion
        const baseScore = this.gameData[level].score;
        const randomFactor = Math.random() * 0.3 - 0.15; // -15% to +15% random variation
        
        switch(level) {
            case 'forest':
                return {
                    attention: Math.max(0, Math.min(18, Math.round((5 - baseScore) * 3 + randomFactor * 10))),
                    focus: Math.max(0, Math.min(18, Math.round((5 - baseScore) * 2.5 + randomFactor * 8))),
                    distractions: Math.max(0, Math.min(18, Math.round((5 - baseScore) * 2 + randomFactor * 6)))
                };
            case 'library':
                return {
                    organization: Math.max(0, Math.min(18, Math.round((5 - baseScore) * 3 + randomFactor * 10))),
                    taskCompletion: Math.max(0, Math.min(18, Math.round((5 - baseScore) * 2.5 + randomFactor * 8))),
                    attention: Math.max(0, Math.min(18, Math.round((5 - baseScore) * 2 + randomFactor * 6)))
                };
            case 'river':
                return {
                    impulseControl: Math.max(0, Math.min(18, Math.round((5 - baseScore) * 3 + randomFactor * 10))),
                    hyperactivity: Math.max(0, Math.min(18, Math.round((5 - baseScore) * 2.5 + randomFactor * 8))),
                    patience: Math.max(0, Math.min(18, Math.round((5 - baseScore) * 2 + randomFactor * 6)))
                };
            case 'tower':
                return {
                    executiveFunction: Math.max(0, Math.min(18, Math.round((5 - baseScore) * 3 + randomFactor * 10))),
                    memory: Math.max(0, Math.min(18, Math.round((5 - baseScore) * 2.5 + randomFactor * 8))),
                    focus: Math.max(0, Math.min(18, Math.round((5 - baseScore) * 2 + randomFactor * 6)))
                };
            default:
                return {};
        }
    }
    
    generateHTML() {
        const completedLevels = Object.keys(this.gameData).filter(level => 
            this.gameData[level].completed
        );
        
        if (completedLevels.length === 0) {
            return '<p>Please complete at least one level to generate a report.</p>';
        }
        
        let html = '<div class="report-header">';
        html += '<h2>📊 Little Explorer Assessment Report</h2>';
        html += '<p>Professional Assessment Based on Game Performance</p>';
        html += '</div>';
        
        // Overall assessment
        html += this.generateOverallAssessment();
        
        // Detailed assessment for each level
        completedLevels.forEach(level => {
            html += this.generateLevelAssessment(level);
        });
        
        // Suggestions and recommendations
        html += this.generateRecommendations();
        
        return html;
    }
    
    generateOverallAssessment() {
        const totalStars = Object.values(this.gameData)
            .filter(level => level.completed)
            .reduce((sum, level) => sum + level.score, 0);
        
        const completedCount = Object.values(this.gameData)
            .filter(level => level.completed).length;
        
        const averageScore = totalStars / completedCount;
        
        let riskLevel = 'low';
        let riskClass = 'risk-low';
        let riskText = 'Low Risk';
        
        if (averageScore < 2) {
            riskLevel = 'high';
            riskClass = 'risk-high';
            riskText = 'High Risk';
        } else if (averageScore < 3) {
            riskLevel = 'medium';
            riskClass = 'risk-medium';
            riskText = 'Medium Risk';
        }
        
        return `
            <div class="report-section overall-assessment">
                <h3>🎯 Overall Assessment</h3>
                <div class="overall-stats">
                    <div class="stat-item">
                        <span class="stat-label">Completed Levels:</span>
                        <span class="stat-value">${completedCount}/4</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Total Stars:</span>
                        <span class="stat-value">${totalStars}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Average Performance:</span>
                        <span class="stat-value">${averageScore.toFixed(1)}/5</span>
                    </div>
                </div>
                <div class="risk-assessment">
                    <h4>Risk Level Assessment</h4>
                    <div class="risk-level ${riskClass}">${riskText}</div>
                    <p class="risk-description">${this.getRiskDescription(riskLevel)}</p>
                </div>
            </div>
        `;
    }
    
    generateLevelAssessment(level) {
        const levelData = this.gameData[level];
        const assessment = this.assessments[level];
        
        const levelNames = {
            forest: '🌲 Magic Forest - Attention Test',
            library: '📚 Ancient Library - Organization Test',
            river: '🌉 Patience River - Impulse Control Test',
            tower: '🏰 Wisdom Tower - Executive Function Test'
        };
        
        let html = `
            <div class="report-section level-assessment">
                <h3>${levelNames[level]}</h3>
                <div class="level-score">
                    <span class="score-label">Level Score:</span>
                    <span class="score-value">${levelData.score}/5 Stars</span>
                    <div class="stars-display">${'⭐'.repeat(levelData.score)}${'☆'.repeat(5 - levelData.score)}</div>
                </div>
        `;
        
        // Add specific assessment metrics
        Object.keys(assessment).forEach(metric => {
            const score = assessment[metric];
            const percentage = (score / 18) * 100;
            const barClass = percentage > 60 ? 'score-high' : percentage > 30 ? 'score-medium' : 'score-low';
            
            html += `
                <div class="metric-item">
                    <div class="metric-label">${this.getMetricLabel(metric)}</div>
                    <div class="score-bar">
                        <div class="score-fill ${barClass}" style="width: ${percentage}%"></div>
                    </div>
                    <div class="metric-score">${score}/18</div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    generateRecommendations() {
        const completedLevels = Object.keys(this.gameData).filter(level => 
            this.gameData[level].completed
        );
        
        let recommendations = [];
        
        // Generate suggestions based on level performance
        completedLevels.forEach(level => {
            const score = this.gameData[level].score;
            const assessment = this.assessments[level];
            
            if (score < 3) {
                switch(level) {
                    case 'forest':
                        recommendations.push("Attention Training: Recommended to practice focus exercises, such as meditation or focus games");
                        break;
                    case 'library':
                        recommendations.push("Organization Training: Recommended to learn task planning and item organization skills");
                        break;
                    case 'river':
                        recommendations.push("Impulse Control Training: Recommended to practice patience exercises and impulse control techniques");
                        break;
                    case 'tower':
                        recommendations.push("Executive Function Training: Recommended to practice memory and logical thinking training");
                        break;
                }
            }
        });
        
        if (recommendations.length === 0) {
            recommendations.push("Excellent performance! Keep up the good study habits.");
        }
        
        let html = `
            <div class="report-section recommendations">
                <h3>💡 Professional Advice</h3>
                <ul class="recommendations-list">
        `;
        
        recommendations.forEach(rec => {
            html += `<li>${rec}</li>`;
        });
        
        html += `
                </ul>
                <div class="note">
                    <p><strong>Note:</strong> This assessment is for reference only. For professional diagnosis, please consult relevant medical professionals.</p>
                </div>
            </div>
        `;
        
        return html;
    }
    
    getMetricLabel(metric) {
        const labels = {
            attention: 'Attention',
            focus: 'Focus',
            distractions: 'Distraction Resistance',
            organization: 'Organization',
            taskCompletion: 'Task Completion',
            impulseControl: 'Impulse Control',
            hyperactivity: 'Hyperactivity',
            patience: 'Patience',
            executiveFunction: 'Executive Function',
            memory: 'Memory'
        };
        return labels[metric] || metric;
    }
    
    getRiskDescription(riskLevel) {
        const descriptions = {
            low: 'Good performance, all abilities are developing normally. Keep it up!',
            medium: 'Some abilities need attention, recommended to conduct targeted training.',
            high: 'Recommended to seek professional guidance for systematic ability training.'
        };
        return descriptions[riskLevel];
    }
}
