// 数据收集器类
class DataCollector {
    constructor() {
        this.data = {
            attention: {
                wrongPaths: 0,
                distractions: 0,
                reactionTime: [],
                focusTime: 0
            },
            organization: {
                missedItems: 0,
                dragOrder: [],
                taskAbandonment: 0,
                completionTime: 0
            },
            impulse: {
                prematureClicks: 0,
                clickFrequency: 0,
                successRate: 0,
                waitingTime: []
            },
            executive: {
                correctAnswers: 0,
                totalAnswers: 0,
                distractionEvents: 0,
                completionTime: 0,
                memoryAccuracy: 0
            }
        };
        this.startTime = Date.now();
    }
    
    // 注意力数据收集
    recordAttentionData(type, value) {
        switch(type) {
            case 'wrongPath':
                this.data.attention.wrongPaths++;
                break;
            case 'distraction':
                this.data.attention.distractions++;
                break;
            case 'reactionTime':
                this.data.attention.reactionTime.push(value);
                break;
            case 'focusTime':
                this.data.attention.focusTime += value;
                break;
        }
    }
    
    // 组织能力数据收集
    recordOrganizationData(type, value) {
        switch(type) {
            case 'missedItem':
                this.data.organization.missedItems++;
                break;
            case 'dragOrder':
                this.data.organization.dragOrder.push(value);
                break;
            case 'taskAbandonment':
                this.data.organization.taskAbandonment++;
                break;
            case 'completionTime':
                this.data.organization.completionTime = value;
                break;
        }
    }
    
    // 冲动控制数据收集
    recordImpulseData(type, value) {
        switch(type) {
            case 'prematureClick':
                this.data.impulse.prematureClicks++;
                break;
            case 'clickFrequency':
                this.data.impulse.clickFrequency += value;
                break;
            case 'successRate':
                this.data.impulse.successRate = value;
                break;
            case 'waitingTime':
                this.data.impulse.waitingTime.push(value);
                break;
        }
    }
    
    // 执行功能数据收集
    recordExecutiveData(type, value) {
        switch(type) {
            case 'correctAnswer':
                this.data.executive.correctAnswers++;
                this.data.executive.totalAnswers++;
                break;
            case 'wrongAnswer':
                this.data.executive.totalAnswers++;
                break;
            case 'distractionEvent':
                this.data.executive.distractionEvents++;
                break;
            case 'completionTime':
                this.data.executive.completionTime = value;
                break;
            case 'memoryAccuracy':
                this.data.executive.memoryAccuracy = value;
                break;
        }
    }
    
    // 计算ADHD评估分数
    calculateADHDScores() {
        const scores = {
            attention: this.calculateAttentionScore(),
            hyperactivity: this.calculateHyperactivityScore(),
            impulsivity: this.calculateImpulsivityScore(),
            executive: this.calculateExecutiveScore()
        };
        
        return {
            scores,
            riskLevel: this.calculateRiskLevel(scores),
            recommendations: this.generateRecommendations(scores)
        };
    }
    
    calculateAttentionScore() {
        const attention = this.data.attention;
        let score = 0;
        
        // 基于错误路径数量
        score += Math.min(attention.wrongPaths * 2, 10);
        
        // 基于分心次数
        score += Math.min(attention.distractions * 1.5, 8);
        
        // 基于反应时间（越慢分数越高）
        if (attention.reactionTime.length > 0) {
            const avgReactionTime = attention.reactionTime.reduce((a, b) => a + b, 0) / attention.reactionTime.length;
            if (avgReactionTime > 2000) score += 5;
            else if (avgReactionTime > 1500) score += 3;
        }
        
        return Math.min(score, 18); // ADHD-RS-IV 最高18分
    }
    
    calculateHyperactivityScore() {
        const impulse = this.data.impulse;
        let score = 0;
        
        // 基于过早点击次数
        score += Math.min(impulse.prematureClicks * 2, 8);
        
        // 基于点击频率
        if (impulse.clickFrequency > 20) score += 5;
        else if (impulse.clickFrequency > 10) score += 3;
        
        // 基于等待时间
        if (impulse.waitingTime.length > 0) {
            const avgWaitingTime = impulse.waitingTime.reduce((a, b) => a + b, 0) / impulse.waitingTime.length;
            if (avgWaitingTime < 1000) score += 5;
        }
        
        return Math.min(score, 18);
    }
    
    calculateImpulsivityScore() {
        const impulse = this.data.impulse;
        let score = 0;
        
        // 基于成功率
        if (impulse.successRate < 0.7) score += 8;
        else if (impulse.successRate < 0.8) score += 5;
        
        // 基于过早点击
        score += Math.min(impulse.prematureClicks * 1.5, 6);
        
        return Math.min(score, 18);
    }
    
    calculateExecutiveScore() {
        const executive = this.data.executive;
        let score = 0;
        
        // 基于正确率
        if (executive.totalAnswers > 0) {
            const accuracy = executive.correctAnswers / executive.totalAnswers;
            if (accuracy < 0.6) score += 8;
            else if (accuracy < 0.8) score += 5;
        }
        
        // 基于分心事件
        score += Math.min(executive.distractionEvents * 2, 6);
        
        // 基于记忆准确性
        if (executive.memoryAccuracy < 0.7) score += 4;
        
        return Math.min(score, 18);
    }
    
    calculateRiskLevel(scores) {
        const totalScore = scores.attention + scores.hyperactivity + scores.impulsivity + scores.executive;
        
        if (totalScore >= 45) return 'high';
        if (totalScore >= 30) return 'medium';
        return 'low';
    }
    
    generateRecommendations(scores) {
        const recommendations = [];
        
        if (scores.attention > 12) {
            recommendations.push("建议进行注意力训练，如专注力游戏或冥想练习");
        }
        
        if (scores.hyperactivity > 12) {
            recommendations.push("建议增加体育活动，帮助释放多余能量");
        }
        
        if (scores.impulsivity > 12) {
            recommendations.push("建议进行冲动控制训练，如深呼吸练习");
        }
        
        if (scores.executive > 12) {
            recommendations.push("建议进行执行功能训练，如任务规划和记忆游戏");
        }
        
        if (recommendations.length === 0) {
            recommendations.push("表现良好，继续保持！");
        }
        
        return recommendations;
    }
    
    getData() {
        return {
            rawData: this.data,
            assessment: this.calculateADHDScores(),
            totalTime: Date.now() - this.startTime
        };
    }
}
