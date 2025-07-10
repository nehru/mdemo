pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                git 'https://github.com/nehru/mdemo'
            }
        }

        stage('Run Analyzer') {
            steps {
                sh '''
                docker run --rm \
                  -v $(pwd):/app \
                  -w /app \
                  --add-host=host.docker.internal:host-gateway \
                  js-analyzer \
                  python js_analyzer.py sample.js
                '''
            }
        }
    }
}
