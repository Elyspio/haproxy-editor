#!/bin/sh
verifyFile() {
  local file_path="$1"

  if [ ! -f "$file_path" ]; then
    echo "Error: File $file_path does not exist."
    return 1
  fi

}

replace() {
  local file_path="$1"
  local placeholder="$2"
  local replacement="$3"

  echo "Replacing $placeholder with $replacement in $file_path"

  verifyFile "$file_path"

  cp "$file_path" "$HOME/tmp"

  sed -i "s|$placeholder|$replacement|g" "$HOME/tmp"

  cat "$HOME/tmp" > "$file_path"
}

verifyEnv() {
  var_name="$1"

  var_value=$(eval echo "\$$var_name")

  # Tester si la variable est définie (non vide)
  if [ -z "$var_value" ]; then
    echo "Warning: Variable '$var_name' is not set or empty."
    return 2
  fi

  # Afficher le nom et la valeur
  echo "$var_name = $var_value"
}

verifyEnv "EXPOSED_PATH"

# Define the file path
PLACEHOLDER="TO_BE_REPLACED_BY_SCRIPT"

find "/usr/share/nginx/html" -type f | while read -r file_path; do
  replace "$file_path" "$PLACEHOLDER" "$EXPOSED_PATH"
done

nginx -g "daemon off;"

