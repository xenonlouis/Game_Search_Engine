import json
import requests
import time
from typing import List, Dict, Tuple
import pandas as pd
import numpy as np
from tabulate import tabulate
import seaborn as sns
import matplotlib.pyplot as plt

class SearchEvaluator:
    def __init__(self):
        # Load test dataset and criteria
        with open('backend/rawg_games.json', 'r', encoding='utf-8') as f:
            self.test_data = json.load(f)
        
        self.test_queries = [
            {
                "name": "Action RPG 2023",
                "query": "action rpg 2023",
                "params": {},
                "expected": ['F1 23', 'Hades', 'Elden Ring', 'The Legend of Zelda: Tears of the Kingdom', 'Rogue Legacy 2', 'Horizon Forbidden West', 'Lies Of P', 'Vampire Survivors', 'Fire Emblem Engage', 'Pikmin 4', 'Need for Speed Unbound', 'Sea of Stars', 'Red Dead Redemption 2', 'Enter the Gungeon',]
            },
            {
                "name": "Nintendo Switch Exclusive",
                "query": "nintendo switch exclusive",
                "params": {},
                "expected": [
                    'Bayonetta 3', 'The Legend of Zelda: Tears of the Kingdom', 'Enter the Gungeon', 'Hades', 'Pikmin 4', 'Sea of Stars', 'Rogue Legacy 2', 'Hot Wheels Unleashed', 'Vampire Survivors', 'Fire Emblem Engage'
                ]
            },
            {
                "name": "High Rated Racing Games",
                "query": "racing cars going fast",
                "params": {},
                "expected": [
                    "Forza Horizon 5",
                    "Gran Turismo 7",
                    "F1 23",
                    "Need for Speed Unbound",
                    "Hot Wheels Unleashed"
                ]
            },
            {
                "name": "Indie Roguelike",
                "query": "indie roguelike",
                "params": {},
                "expected": [
                    "Hades",
                    "Enter the Gungeon",
                    "Rogue Legacy 2",
                    "Vampire Survivors"
                ]
            },
            {
                "name": "Open World Adventure",
                "query": "open world adventure",
                "params": {},
                "expected": [
                    "Marvel's Spider-Man 2", 'Red Dead Redemption 2', 'Elden Ring', 'Dead Cell', 'The Legend of Zelda: Tears of the Kingdom', 'Horizon Forbidden West', 'Pikmin 4', 'Sea of Stars', 'Fire Emblem Engage', 'Octopath Traveler 2', 'Hades', 'Rogue Legacy 2', 'F1 23', 'Super Mario Bros. Wonder', 'Lies Of P', 'Forza Horizon 5', 'Need for Speed Unbound', 'Bayonetta 3', 'Gran Turismo 7'
                    
                ]
            }
        ]

    def calculate_metrics(self, results: List[str], expected: List[str]) -> Dict:
        """Calculate precision, recall, and F1-score"""
        # Convert to sets for easier comparison
        results_set = set(results)
        expected_set = set(expected)
        
        # Calculate metrics
        true_positives = len(results_set & expected_set)  # Intersection
        false_positives = len(results_set - expected_set)  # In results but not expected
        false_negatives = len(expected_set - results_set)  # In expected but not in results
        
        # Calculate true negatives
        all_games = set(game['name'] for game in self.test_data)
        true_negatives = len(all_games - results_set - expected_set)
        
        # Debug prints
        print("\nDetailed Metrics Calculation:")
        print(f"Expected items not found in results (False Negatives):")
        print(expected_set - results_set)
        
        # Calculate ratios
        precision = true_positives / len(results) if results else 0
        recall = true_positives / len(expected) if expected else 0
        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        
        return {
            "true_positives": true_positives,
            "false_positives": false_positives,
            "false_negatives": false_negatives,
            "true_negatives": true_negatives,
            "precision": precision,
            "recall": recall,
            "f1_score": f1
        }

    def calculate_confusion_matrix(self, results: List[str], expected: List[str]) -> Tuple[np.ndarray, List[str]]:
        """Calculate confusion matrix for the search results"""
        # Initialize 2x2 confusion matrix
        matrix = np.zeros((2, 2))
        
        # Get all unique games from the test data
        all_games = set(game['name'] for game in self.test_data)  # Use all possible games as universe
        
        for game in all_games:
            is_relevant = game in expected
            is_retrieved = game in results
            
            if is_relevant and is_retrieved:
                matrix[1, 1] += 1  # True Positive
            elif is_relevant and not is_retrieved:
                matrix[1, 0] += 1  # False Negative
            elif not is_relevant and is_retrieved:
                matrix[0, 1] += 1  # False Positive
            else:
                matrix[0, 0] += 1  # True Negative
        
        return matrix

    def plot_confusion_matrix(self, matrix: np.ndarray, query_name: str):
        """Plot confusion matrix using seaborn"""
        plt.figure(figsize=(8, 6))
        sns.heatmap(
            matrix,
            annot=True,
            fmt='g',
            cmap='Blues',
            xticklabels=['Not Retrieved', 'Retrieved'],
            yticklabels=['Not Relevant', 'Relevant']
        )
        plt.title(f'Confusion Matrix for "{query_name}"')
        plt.ylabel('Actual')
        plt.xlabel('Predicted')
        
        # Save the plot
        plt.savefig(f'data/confusion_matrix_{query_name.lower().replace(" ", "_")}.png')
        plt.close()

    def evaluate_query(self, query_data: Dict) -> Dict:
        """Evaluate a single search query"""
        start_time = time.time()
        
        # Make the API request
        params = {"q": query_data["query"], **query_data["params"]}
        response = requests.get("http://localhost:8000/search", params=params)
        
        response_time = time.time() - start_time
        
        if response.status_code != 200:
            return {
                "success": False,
                "error": f"API request failed with status {response.status_code}"
            }
        
        
        # Get results
        results = [game["name"] for game in sorted( response.json(), key=lambda x: x["relevance_score"], reverse=True)]
        
        print(results);

                
        # Calculate metrics
        metrics = self.calculate_metrics(results, query_data["expected"])
        metrics["response_time"] = response_time
        metrics["results"] = results
        
        # Calculate and plot confusion matrix
        confusion_matrix = self.calculate_confusion_matrix(results, query_data["expected"])
        self.plot_confusion_matrix(confusion_matrix, query_data["name"])
        
        # Add confusion matrix to metrics
        metrics["confusion_matrix"] = confusion_matrix.tolist()
        
        return metrics

    def run_evaluation(self):
        """Run evaluation for all test queries"""
        results = []
        
        for query in self.test_queries:
            print(f"\nEvaluating query: {query['name']}")
            metrics = self.evaluate_query(query)
            
            results.append({
                "Query": query["name"],
                "Precision": f"{metrics['precision']:.2f}",
                "Recall": f"{metrics['recall']:.2f}",
                "F1-Score": f"{metrics['f1_score']:.2f}",
                "Response Time": f"{metrics['response_time']*1000:.0f}ms",
                "True Positives": metrics["true_positives"],
                "False Positives": metrics["false_positives"],
                "True Negatives": metrics["true_negatives"],
                "Results": metrics["results"],
                "Expected": query["expected"],
                "Confusion Matrix": metrics["confusion_matrix"]
            })
            
            # Print detailed results
            print("\nResults:")
            print("Found:", metrics["results"])
            print("Expected:", query["expected"])
            print(f"\nMetrics:")
            print(f"Precision: {metrics['precision']:.2f}")
            print(f"Recall: {metrics['recall']:.2f}")
            print(f"F1-Score: {metrics['f1_score']:.2f}")
            print(f"Response Time: {metrics['response_time']*1000:.0f}ms")
            print(f"True Negatives: {metrics['true_negatives']}")
            print("\nConfusion Matrix:")
            print(tabulate(
                metrics["confusion_matrix"],
                headers=['Not Retrieved', 'Retrieved'],
                showindex=['Not Relevant', 'Relevant'],
                tablefmt='grid'
            ))
            
        # Create summary table
        df = pd.DataFrame(results)
        print("\nSummary Table:")
        print(tabulate(
            df.drop(["Results", "Expected", "Confusion Matrix"], axis=1),
            headers='keys',
            tablefmt='grid'
        ))
        
        # Save results to file
        with open('data/evaluation_results.json', 'w') as f:
            json.dump(results, f, indent=2)

if __name__ == "__main__":
    evaluator = SearchEvaluator()
    evaluator.run_evaluation() 