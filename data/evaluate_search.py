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
        with open('data/rawg_games.json', 'r', encoding='utf-8') as f:
            self.test_data = json.load(f)
        
        self.test_queries = [
            {
                "name": "Action RPG 2023",
                "query": "action rpg 2023",
                "params": {},
                "expected": ['The Legend of Zelda: Tears of the Kingdom', 'Lies Of P', 'Sea of Stars', "Marvel's Spider-Man 2"]
            },
            {
                "name": "Nintendo Switch Exclusive",
                "query": "nintendo switch exclusive",
                "params": {"platform": "Nintendo Switch"},
                "expected": [
                    "The Legend of Zelda: Tears of the Kingdom",
                    "Super Mario Bros. Wonder",
                    "Pikmin 4",
                    "Fire Emblem Engage",
                    "Bayonetta 3"
                ]
            },
            {
                "name": "High Rated Racing Games",
                "query": "high rated racing games",
                "params": {"genre": "Racing", "min_rating": 4.0, "sort_by": "rating"},
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
                "params": {"genre": "Adventure"},
                "expected": [
                    "The Legend of Zelda: Tears of the Kingdom",
                    "Red Dead Redemption 2",
                    "Elden Ring",
                    "Horizon Forbidden West",
                    "Marvel's Spider-Man 2",
                    "Hades"
                ]
            }
        ]

    def calculate_metrics(self, results: List[str], expected: List[str]) -> Dict:
        """Calculate precision, recall, and F1-score"""
        true_positives = len(set(results) & set(expected))
        false_positives = len(set(results) - set(expected))
        false_negatives = len(set(expected) - set(results))
        
        precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0
        recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0
        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        
        return {
            "true_positives": true_positives,
            "false_positives": false_positives,
            "false_negatives": false_negatives,
            "precision": precision,
            "recall": recall,
            "f1_score": f1
        }

    def calculate_confusion_matrix(self, results: List[str], expected: List[str]) -> Tuple[np.ndarray, List[str]]:
        """Calculate confusion matrix for the search results"""
        # Get all unique game names
        all_games = sorted(list(set(results + expected)))
        
        # Create confusion matrix
        n = len(all_games)
        matrix = np.zeros((2, 2))
        
        # For each game in the results
        for game in all_games:
            # True Positive: game is in both results and expected
            if game in results and game in expected:
                matrix[1, 1] += 1
            # False Positive: game is in results but not in expected
            elif game in results and game not in expected:
                matrix[0, 1] += 1
            # False Negative: game is in expected but not in results
            elif game not in results and game in expected:
                matrix[1, 0] += 1
            # True Negative: game is neither in results nor expected
            else:
                matrix[0, 0] += 1
        
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
        results = [game["name"] for game in response.json()]
        
        # Calculate metrics
        metrics = self.calculate_metrics(results[:5], query_data["expected"])
        metrics["response_time"] = response_time
        metrics["results"] = results[:5]
        
        # Calculate and plot confusion matrix
        confusion_matrix = self.calculate_confusion_matrix(results[:5], query_data["expected"])
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
                "False Negatives": metrics["false_negatives"],
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