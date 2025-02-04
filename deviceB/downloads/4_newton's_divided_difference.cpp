#include <iostream>
#include <fstream>
#include <vector>
#include <cmath>
#include <algorithm>

using namespace std;

// function to read and store input data 
bool readInputData(const string& filename, vector<double>& x, vector<double>& y) {
    ifstream file(filename);
    if (!file.is_open()) {
        cerr << "Error: Could not open file '" << filename << "'" << endl;
        return false;
    }

    // Read pairs of x and y values from the file
    double xval, yval;
    while (file >> xval >> yval) {
        if (!(file.good())) {
            if (file.eof()) {
                break;
            } else {
                cerr << "Error: Non-numeric value found in input, skipping line." << endl;
                continue;
            }
        }

        x.push_back(xval);
        y.push_back(yval);
    }

    // Verify data integrity
    if (x.size() != y.size()) {
        cerr << "Error: Incomplete data, missing x or y value, skipping line." << endl;
        return false;
    }

    file.close();
    return true;
}

// Structure to hold paired x-y coordinates for sorting
struct Point {
    double x;
    double y;
};

// Comparison function for sorting points by x-coordinate
bool comparePoints(const Point& a, const Point& b) {
    return a.x < b.x;
}

vector<double> computeDividedDifferences(const vector<double>& x, const vector<double>& y) {
    vector<double> diff(x.size());
    
    // Initialize with y-values
    for (size_t i = 0; i < x.size(); ++i) {
        diff[i] = y[i];
    }

    // Compute divided differences
    for (size_t j = 1; j < x.size(); ++j) {
        for (size_t i = x.size() - 1; i >= j; --i) {
            // Check for duplicate x-values which would cause division by zero
            if (abs(x[i] - x[i - j]) < 1e-10) {
                cerr << "Error: Repeated x-value at index " << i << endl;
                return {};
            }
            diff[i] = (diff[i] - diff[i - 1]) / (x[i] - x[i - j]);
        }
    }

    return diff;
}

double evaluateInterpolatingPolynomial(const vector<double>& x, const vector<double>& diff, double xq) {
    double result = diff[0];
    
    // Compute the interpolated value using Newton's form
    for (size_t i = 1; i < x.size(); ++i) {
        double term = diff[i];
        for (size_t j = 0; j < i; ++j) {
            term *= (xq - x[j]);
        }
        result += term;
    }
    return result;
}

void newtonsInterpolation(const string& inputFile) {
    // Read input data
    vector<double> x, y;
    if (!readInputData(inputFile, x, y)) {
        return;
    }

    // Create vector of points for sorting
    vector<Point> points(x.size());
    for (size_t i = 0; i < x.size(); ++i) {
        points[i].x = x[i];
        points[i].y = y[i];
    }

    // Sort points by x-coordinate
    sort(points.begin(), points.end(), comparePoints);

    // Extract sorted coordinates back into separate vectors
    vector<double> sortedX(x.size()), sortedY(y.size());
    for (size_t i = 0; i < points.size(); ++i) {
        sortedX[i] = points[i].x;
        sortedY[i] = points[i].y;
    }

    // Compute divided differences for interpolation
    vector<double> diff = computeDividedDifferences(sortedX, sortedY);
    if (diff.empty()) {
        return;
    }

    // Interactive loop for interpolation queries
    double xq;
    while (true) {
        cout << "Enter the x-value for interpolation (or -1 to exit): ";
        cin >> xq;
        if (xq == -1) {
            break;
        }

        // Check if query point is within the data range
        if (xq < sortedX.front() || xq > sortedX.back()) {
            cerr << "Warning: Extrapolating outside data range - results may be unreliable" << endl;
        }

        // Compute and display interpolated value
        double result = evaluateInterpolatingPolynomial(sortedX, diff, xq);
        cout << "The interpolated y-value at x = " << xq << " is: " << result << endl;
    }
}

int main() {
    string inputFile;
    cout << "Enter the input file name: ";
    cin >> inputFile;

    newtonsInterpolation(inputFile);

    return 0;
}