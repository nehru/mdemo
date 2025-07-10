pipeline {
    agent {
        docker {
            image 'python:3.11-slim'
            args '-v /var/run/docker.sock:/var/run/docker.sock' // if you need docker inside docker
        }
    }

    stages {
        stage('Install Dependencies') {
            steps {
                sh 'pip install -r requirements.txt'
            }
        }
        stage('Run Analyzer') {
            steps {
                sh 'python js_analyzer.py sample.js'
            }
        }
    }
}
