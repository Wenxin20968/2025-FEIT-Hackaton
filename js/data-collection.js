// Data Collector Class
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
    
    // Attention data collection
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
    
    // Organization data collection
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
    
    // Impulse control data collection
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
    
    // Executive function data collection
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
    
    // Calculate ADHD assessment score
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
        
        // Based on wrong path count
        score += Math.min(attention.wrongPaths * 2, 10);
        
        // Based on distraction count
        score += Math.min(attention.distractions * 1.5, 8);
        
        // Based on reaction time (slower = higher score)
        if (attention.reactionTime.length > 0) {
            const avgReactionTime = attention.reactionTime.reduce((a, b) => a + b, 0) / attention.reactionTime.length;
            if (avgReactionTime > 2000) score += 5;
            else if (avgReactionTime > 1500) score += 3;
        }
        
        return Math.min(score, 18); // ADHD-RS-IV maximum 18 points
    }
    
    calculateHyperactivityScore() {
        const impulse = this.data.impulse;
        let score = 0;
        
        // Based on premature click count
        score += Math.min(impulse.prematureClicks * 2, 8);
        
        // Based on click frequency
        if (impulse.clickFrequency > 20) score += 5;
        else if (impulse.clickFrequency > 10) score += 3;
        
        // Based on waiting time
        if (impulse.waitingTime.length > 0) {
            const avgWaitingTime = impulse.waitingTime.reduce((a, b) => a + b, 0) / impulse.waitingTime.length;
            if (avgWaitingTime < 1000) score += 5;
        }
        
        return Math.min(score, 18);
    }
    
    calculateImpulsivityScore() {
        const impulse = this.data.impulse;
        let score = 0;
        
        // Based on success rate
        if (impulse.successRate < 0.7) score += 8;
        else if (impulse.successRate < 0.8) score += 5;
        
        // Based on premature clicks
        score += Math.min(impulse.prematureClicks * 1.5, 6);
        
        return Math.min(score, 18);
    }
    
    calculateExecutiveScore() {
        const executive = this.data.executive;
        let score = 0;
        
        // Based on accuracy rate
        if (executive.totalAnswers > 0) {
            const accuracy = executive.correctAnswers / executive.totalAnswers;
            if (accuracy < 0.6) score += 8;
            else if (accuracy < 0.8) score += 5;
        }
        
        // Based on distraction events
        score += Math.min(executive.distractionEvents * 2, 6);
        
        // Based on memory accuracy
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
            recommendations.push("Recommended to perform attention training, such as focus games or meditation exercises");
        }
        
        if (scores.hyperactivity > 12) {
            recommendations.push("Recommended to increase physical activities to help release excess energy");
        }
        
        if (scores.impulsivity > 12) {
            recommendations.push("Recommended to perform impulse control training, such as deep breathing exercises");
        }
        
        if (scores.executive > 12) {
            recommendations.push("Recommended to perform executive function training, such as task planning and memory games");
        }
        
        if (recommendations.length === 0) {
            recommendations.push("Good performance, keep it up!");
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
