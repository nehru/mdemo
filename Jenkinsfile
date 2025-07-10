pipeline {
  agent any

  stages {
    stage('Checkout') {
      steps {
        git 'https://github.com/nehru/mdemo'
      }
    }

    stage('Run Analyzer in Docker') {
      steps {
        sh '''
          docker run --rm \
          -v $PWD:/app \
          -w /app \
          python:3.11-slim \
          bash -c "pip install -r requirements.txt && python js_analyzer.py sample.js"
        '''
      }
    }
  }
}
