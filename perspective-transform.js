(function(global) {
  function solveLinearSystem(matrix, values) {
    var length = values.length;

    for (var column = 0; column < length; column++) {
      var pivot = column;

      for (var row = column + 1; row < length; row++) {
        if (Math.abs(matrix[row][column]) > Math.abs(matrix[pivot][column])) {
          pivot = row;
        }
      }

      var matrixRow = matrix[column];
      matrix[column] = matrix[pivot];
      matrix[pivot] = matrixRow;

      var value = values[column];
      values[column] = values[pivot];
      values[pivot] = value;

      var pivotValue = matrix[column][column] || 1;

      for (row = column + 1; row < length; row++) {
        var factor = matrix[row][column] / pivotValue;

        for (var item = column; item < length; item++) {
          matrix[row][item] -= factor * matrix[column][item];
        }

        values[row] -= factor * values[column];
      }
    }

    var result = new Array(length);

    for (row = length - 1; row >= 0; row--) {
      var sum = values[row];

      for (column = row + 1; column < length; column++) {
        sum -= matrix[row][column] * result[column];
      }

      result[row] = sum / (matrix[row][row] || 1);
    }

    result.push(1);
    return result;
  }

  function getCoefficients(source, destination) {
    var matrix = [];
    var values = [];

    for (var point = 0; point < 4; point++) {
      var x = source[point * 2];
      var y = source[point * 2 + 1];
      var u = destination[point * 2];
      var v = destination[point * 2 + 1];

      matrix.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
      values.push(u);
      matrix.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
      values.push(v);
    }

    return solveLinearSystem(matrix, values);
  }

  function applyCoefficients(coefficients, x, y) {
    var denominator = coefficients[6] * x + coefficients[7] * y + 1;

    return [
      (coefficients[0] * x + coefficients[1] * y + coefficients[2]) / denominator,
      (coefficients[3] * x + coefficients[4] * y + coefficients[5]) / denominator
    ];
  }

  function PerspT(source, destination) {
    if (!(this instanceof PerspT)) return new PerspT(source, destination);

    this.srcPts = source;
    this.dstPts = destination;
    this.coeffs = getCoefficients(source, destination);
    this.coeffsInv = getCoefficients(destination, source);
  }

  PerspT.prototype.transform = function(x, y) {
    return applyCoefficients(this.coeffs, x, y);
  };

  PerspT.prototype.transformInverse = function(x, y) {
    return applyCoefficients(this.coeffsInv, x, y);
  };

  global.PerspT = PerspT;
})(window);
