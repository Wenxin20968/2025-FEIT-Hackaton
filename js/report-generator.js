// 报告生成器类
class ReportGenerator {
    constructor(gameData) {
        this.gameData = gameData;
        this.assessments = {};
        this.calculateAllAssessments();
    }
    
    calculateAllAssessments() {
        // 为每个关卡计算评估数据
        Object.keys(this.gameData).forEach(level => {
            if (this.gameData[level].completed) {
                const dataCollector = new DataCollector();
                // 模拟数据收集（实际应用中会从真实数据中获取）
                this.assessments[level] = this.simulateAssessment(level);
            }
        });
    }
    
    simulateAssessment(level) {
        // 基于关卡完成情况模拟评估数据
        const baseScore = this.gameData[level].score;
        const randomFactor = Math.random() * 0.3 - 0.15; // -15% 到 +15% 的随机变化
        
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
            return '<p>请先完成至少一个关卡来生成报告。</p>';
        }
        
        let html = '<div class="report-header">';
        html += '<h2>📊 小小探险家评估报告</h2>';
        html += '<p>基于游戏表现的专业评估</p>';
        html += '</div>';
        
        // 总体评估
        html += this.generateOverallAssessment();
        
        // 各关卡详细评估
        completedLevels.forEach(level => {
            html += this.generateLevelAssessment(level);
        });
        
        // 建议和推荐
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
        let riskText = '低风险';
        
        if (averageScore < 2) {
            riskLevel = 'high';
            riskClass = 'risk-high';
            riskText = '高风险';
        } else if (averageScore < 3) {
            riskLevel = 'medium';
            riskClass = 'risk-medium';
            riskText = '中等风险';
        }
        
        return `
            <div class="report-section overall-assessment">
                <h3>🎯 总体评估</h3>
                <div class="overall-stats">
                    <div class="stat-item">
                        <span class="stat-label">完成关卡:</span>
                        <span class="stat-value">${completedCount}/4</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">总星星数:</span>
                        <span class="stat-value">${totalStars}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">平均表现:</span>
                        <span class="stat-value">${averageScore.toFixed(1)}/5</span>
                    </div>
                </div>
                <div class="risk-assessment">
                    <h4>风险等级评估</h4>
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
            forest: '🌲 魔法森林 - 注意力测试',
            library: '📚 古老书院 - 组织能力测试',
            river: '🌉 耐心之河 - 冲动控制测试',
            tower: '🏰 智慧之塔 - 执行功能测试'
        };
        
        let html = `
            <div class="report-section level-assessment">
                <h3>${levelNames[level]}</h3>
                <div class="level-score">
                    <span class="score-label">关卡得分:</span>
                    <span class="score-value">${levelData.score}/5 星星</span>
                    <div class="stars-display">${'⭐'.repeat(levelData.score)}${'☆'.repeat(5 - levelData.score)}</div>
                </div>
        `;
        
        // 添加具体评估指标
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
        
        // 基于各关卡表现生成建议
        completedLevels.forEach(level => {
            const score = this.gameData[level].score;
            const assessment = this.assessments[level];
            
            if (score < 3) {
                switch(level) {
                    case 'forest':
                        recommendations.push("注意力训练：建议进行专注力练习，如冥想或专注力游戏");
                        break;
                    case 'library':
                        recommendations.push("组织能力训练：建议学习任务规划和物品整理技巧");
                        break;
                    case 'river':
                        recommendations.push("冲动控制训练：建议进行耐心练习和冲动控制技巧");
                        break;
                    case 'tower':
                        recommendations.push("执行功能训练：建议进行记忆和逻辑思维训练");
                        break;
                }
            }
        });
        
        if (recommendations.length === 0) {
            recommendations.push("表现优秀！继续保持良好的学习习惯。");
        }
        
        let html = `
            <div class="report-section recommendations">
                <h3>💡 专业建议</h3>
                <ul class="recommendations-list">
        `;
        
        recommendations.forEach(rec => {
            html += `<li>${rec}</li>`;
        });
        
        html += `
                </ul>
                <div class="note">
                    <p><strong>注意：</strong>此评估仅供参考，如需专业诊断请咨询相关医疗专业人士。</p>
                </div>
            </div>
        `;
        
        return html;
    }
    
    getMetricLabel(metric) {
        const labels = {
            attention: '注意力',
            focus: '专注力',
            distractions: '抗干扰能力',
            organization: '组织能力',
            taskCompletion: '任务完成度',
            impulseControl: '冲动控制',
            hyperactivity: '多动表现',
            patience: '耐心程度',
            executiveFunction: '执行功能',
            memory: '记忆力'
        };
        return labels[metric] || metric;
    }
    
    getRiskDescription(riskLevel) {
        const descriptions = {
            low: '表现良好，各项能力发展正常。继续保持！',
            medium: '部分能力需要关注，建议进行针对性训练。',
            high: '建议寻求专业指导，进行系统性的能力训练。'
        };
        return descriptions[riskLevel];
    }
}
