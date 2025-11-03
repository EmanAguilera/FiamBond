# my_fiambond_python/create_bucket.py

import boto3
from botocore.exceptions import ClientError

# --- Configuration ---
LOCALSTACK_ENDPOINT_URL = "http://localhost:4566"
BUCKET_NAME = "fiambond-local-test-bucket"
AWS_ACCESS_KEY_ID = "test"
AWS_SECRET_ACCESS_KEY = "test"
AWS_REGION = "us-east-1"


def create_s3_bucket(s3_client, bucket_name: str, region: str) -> bool:
    """Creates an S3 bucket in LocalStack, handling the us-east-1 region quirk."""
    try:
        print(f"Attempting to create S3 bucket: '{bucket_name}'...")
        if region == "us-east-1":
            s3_client.create_bucket(Bucket=bucket_name)
        else:
            s3_client.create_bucket(
                Bucket=bucket_name,
                CreateBucketConfiguration={'LocationConstraint': region}
            )
        print(f"✅ Success! Bucket '{bucket_name}' created.")
        return True
    except ClientError as e:
        if e.response["Error"]["Code"] == "BucketAlreadyOwnedByYou":
            print(f"⚠️  Bucket '{bucket_name}' already exists. Continuing.")
            return True
        else:
            print(f"❌ A ClientError occurred while creating bucket: {e}")
            return False

# --- NEW FUNCTION TO UPLOAD A FILE ---
def upload_file_to_s3(s3_client, bucket_name: str, file_path: str, object_name: str) -> bool:
    """
    Uploads a file to the specified S3 bucket.

    Args:
        s3_client: An initialized boto3 S3 client.
        bucket_name: The bucket to upload to.
        file_path: The path to the file you want to upload.
        object_name: The name you want the file to have inside the bucket.
    
    Returns:
        True if upload was successful, False otherwise.
    """
    try:
        print(f"Attempting to upload file '{file_path}' to bucket '{bucket_name}' as '{object_name}'...")
        # boto3's 'upload_file' is a smart function that handles large files
        # and multipart uploads automatically.
        s3_client.upload_file(file_path, bucket_name, object_name)
        print(f"✅ Success! File uploaded.")
        return True
    except ClientError as e:
        print(f"❌ A ClientError occurred while uploading file: {e}")
        return False
    except FileNotFoundError:
        print(f"❌ Error: The file '{file_path}' was not found.")
        return False

# --- NEW FUNCTION TO LIST FILES ---
def list_files_in_bucket(s3_client, bucket_name: str):
    """Lists all the files in an S3 bucket."""
    try:
        print(f"\n--- Files in bucket '{bucket_name}' ---")
        response = s3_client.list_objects_v2(Bucket=bucket_name)
        
        if 'Contents' in response:
            for obj in response['Contents']:
                print(f"- {obj['Key']} (Size: {obj['Size']} bytes)")
        else:
            print("Bucket is empty.")
        print("---------------------------------")
    except ClientError as e:
        print(f"❌ Could not list files. A ClientError occurred: {e}")


if __name__ == "__main__":
    # 1. Create a dummy file to upload.
    # In your project's `my_fiambond_python` folder, create a new file
    # named `receipt.txt` and write "Hello World" in it.
    file_to_upload = "receipt.txt"
    object_name_in_s3 = "loan-receipts/receipt-001.txt" # You can use folders

    # 2. Initialize the S3 client for LocalStack.
    s3 = boto3.client(
        "s3",
        endpoint_url=LOCALSTACK_ENDPOINT_URL,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION,
    )

    # 3. Run the full sequence: Create, Upload, List.
    if create_s3_bucket(s3, BUCKET_NAME, AWS_REGION):
        if upload_file_to_s3(s3, BUCKET_NAME, file_to_upload, object_name_in_s3):
            # If upload is successful, list the files to verify.
            list_files_in_bucket(s3, BUCKET_NAME)

    print("\n--- Script finished ---")