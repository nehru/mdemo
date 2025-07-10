pipeline {
    agent any

    environment {
        OLLAMA_API_URL = "http://ollama:11434" // Ensure this matches your Ollama service name in docker-compose.yml
    }

    stages {
        stage('Checkout Code') {
            steps {
                // This step is implicitly handled when using "Pipeline script from SCM" for the Jenkinsfile itself.
                // However, if your js_analyzer.py or other files are in a *different* repository,
                // or if you want to explicitly check out this repo, you can keep a 'git' step here.
                // For now, if the Jenkinsfile itself is in this repo, Jenkins already has it.
                echo "Code already checked out by Jenkins."
            }
        }

        stage('Install Project Dependencies') {
            steps {
                // This step installs Python dependencies specific to your analysis script.
                // It assumes 'requirements.txt' is at the root of your Git repo (alongside Jenkinsfile).
                // If your js_analyzer.py has its own requirements.txt, ensure it's here.
                // Otherwise, remove or comment this line.
                sh 'pip install -r requirements.txt --break-system-packages'
            }
        }

        stage('Perform JS Code Analysis with Ollama') {
            steps {
                script {
                    echo "Starting JS Code Analysis..."
                    // This command executes your Python analysis script.
                    // It assumes 'js_analyzer.py' is at the root of your Git repo.
                    // Make sure js_analyzer.py expects the Ollama API URL as its first argument.
                    def analysisOutput = sh(script: "python3 js_analyzer.py ${env.OLLAMA_API_URL}", returnStdout: true, returnStatus: true)

                    if (analysisOutput.status != 0) {
                        echo "❌ JS Analysis Script Failed with exit code ${analysisOutput.status}"
                        error "Analysis script failed: ${analysisOutput.stdout}" // Fail the pipeline
                    } else {
                        echo "✅ JS Analysis Script Completed Successfully."
                        echo "Analysis Output:\n${analysisOutput.stdout}"
                    }
                }
            }
        }
    }
}